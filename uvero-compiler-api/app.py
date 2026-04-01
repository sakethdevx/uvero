"""
Uvero Compiler API — Lightweight Code Execution Service
Runs code in sandboxed subprocesses with resource limits.
Designed for deployment on HuggingFace Spaces (Docker).
"""

import os
import sys
import time
import uuid
import shutil
import signal
import tempfile
import resource
import subprocess
import importlib.util
from pathlib import Path
from typing import Optional, List

CURRENT_DIR = Path(__file__).resolve().parent
# Candidates where analysis/ might live in different deploy layouts (local vs HF Space)
ANALYSIS_CANDIDATES = [
    CURRENT_DIR / "analysis",
    CURRENT_DIR.parent / "analysis",
    CURRENT_DIR / "uvero-compiler-api" / "analysis",
]

for p in [CURRENT_DIR] + ANALYSIS_CANDIDATES:
    if str(p) not in sys.path and p.exists():
        sys.path.insert(0, str(p))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Lightweight built-in static analyzer (Tree-sitter). Avoid external imports failing.
ANALYSIS_IMPORT_ERROR = None
try:
    from tree_sitter import Language, Parser  # type: ignore
    from tree_sitter_languages import get_language  # type: ignore

    def _parser(lang: str) -> Optional[Parser]:
        try:
            language = get_language(lang)
            parser = Parser()
            parser.set_language(language)
            return parser
        except Exception:
            return None

    def _class_from_depth(depth: int, recursive: bool) -> str:
        if recursive and depth <= 1:
            return "O(n)"
        if depth <= 0:
            return "O(1)"
        if depth == 1:
            return "O(n)"
        if depth == 2:
            return "O(n^2)"
        return "O(n^k)"

    def _node_text(node):
        return getattr(node, "text", b"").decode(errors="ignore") if hasattr(node, "text") else ""

    def _find_identifier(node):
        for child in node.children:
            if child.type in {"identifier", "field_identifier"}:
                return _node_text(child)
        return None

    def _walk(node, lang: str, ctx: dict):
        loop_types = {
            "python": {"for_statement", "while_statement", "for_in_clause"},
            "javascript": {"for_statement", "for_in_statement", "for_of_statement", "while_statement", "do_statement"},
            "typescript": {"for_statement", "for_in_statement", "for_of_statement", "while_statement", "do_statement"},
            "java": {"for_statement", "enhanced_for_statement", "while_statement", "do_statement"},
            "c": {"for_statement", "while_statement"},
            "cpp": {"for_statement", "while_statement"},
        }
        alloc_nodes = {
            "python": {"list", "dictionary", "set", "list_comprehension", "set_comprehension", "dictionary_comprehension"},
            "javascript": {"array", "object"},
            "typescript": {"array", "object"},
            "java": {"object_creation_expression", "array_creation_expression"},
            "c": {"initializer_list"},
            "cpp": {"initializer_list", "new_expression"},
        }
        loop_set = loop_types.get(lang, set())
        alloc_set = alloc_nodes.get(lang, set())

        if node.type in {"function_definition", "method_declaration", "function_declaration"}:
            name = _find_identifier(node)
            if name:
                ctx.setdefault("func_stack", []).append(name)
        elif node.type in {"call", "call_expression"} and ctx.get("func_stack"):
            target = _find_identifier(node)
            if target and target == ctx["func_stack"][-1]:
                ctx["recursive"] = 1

        if node.type in loop_set:
            ctx["loop_depth"] += 1
            ctx["max_loop_depth"] = max(ctx["max_loop_depth"], ctx["loop_depth"])
        if node.type in alloc_set:
            ctx["allocs"] += 1

        for child in node.children:
            _walk(child, lang, ctx)

        if node.type in loop_set:
            ctx["loop_depth"] -= 1
        if node.type in {"function_definition", "method_declaration", "function_declaration"} and ctx.get("func_stack"):
            ctx["func_stack"].pop()

    def analyze_static_complexity(language: str, code: str) -> Optional[dict]:
        lang_key = {
            "python": "python", "py": "python",
            "javascript": "javascript", "js": "javascript",
            "typescript": "typescript", "ts": "typescript",
            "java": "java", "c": "c", "cpp": "cpp", "c++": "cpp",
        }.get(language.lower())
        if not lang_key:
            return None
        parser = _parser(lang_key)
        if parser is None:
            return None
        tree = parser.parse(code.encode("utf-8"))
        ctx = {"loop_depth": 0, "max_loop_depth": 0, "allocs": 0, "recursive": 0}
        _walk(tree.root_node, lang_key, ctx)
        time_class = _class_from_depth(ctx["max_loop_depth"], bool(ctx["recursive"]))
        space_class = "O(n)" if ctx["allocs"] > 0 else "O(1)"
        confidence = 0.6
        if ctx["allocs"] > 2 or ctx["max_loop_depth"] >= 2:
            confidence = 0.7
        if ctx["recursive"]:
            confidence = max(confidence, 0.75)
        return {
            "status": "success",
            "time_complexity": {"class": time_class, "method": "static", "confidence": round(confidence, 2)},
            "space_complexity": {"class": space_class, "method": "static", "confidence": round(confidence - 0.1, 2)},
            "static_notes": [
                f"Loop depth: {ctx['max_loop_depth']}",
                "Recursion detected" if ctx["recursive"] else "No recursion",
                f"Allocations: {ctx['allocs']}",
            ],
            "samples": [],
        }
except Exception as e:
    ANALYSIS_IMPORT_ERROR = str(e)

app = FastAPI(
    title="Uvero Compiler API",
    description="Execute code in 20+ languages securely",
    version="1.0.0",
)

# CORS — allow Uvero frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your Uvero domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Language Configurations ───────────────────────────────────────────────────

LANGUAGES = {
    "python": {
        "name": "Python 3",
        "extension": ".py",
        "compile": None,
        "run": ["python3", "{file}"],
        "version_cmd": ["python3", "--version"],
    },
    "javascript": {
        "name": "Node.js",
        "extension": ".js",
        "compile": None,
        "run": ["node", "{file}"],
        "version_cmd": ["node", "--version"],
    },
    "typescript": {
        "name": "TypeScript",
        "extension": ".ts",
        "compile": ["ts-node", "--transpile-only", "--compiler-options", "{\"module\":\"CommonJS\"}", "{file}"],
        "run": None,
        "version_cmd": ["ts-node", "--version"],
    },

    "c": {
        "name": "C (GCC)",
        "extension": ".c",
        "compile": ["gcc", "-o", "{output}", "{file}", "-lm"],
        "run": ["{output}"],
        "version_cmd": ["gcc", "--version"],
    },
    "cpp": {
        "name": "C++ (G++)",
        "extension": ".cpp",
        "compile": ["g++", "-o", "{output}", "{file}", "-lm", "-lstdc++"],
        "run": ["{output}"],
        "version_cmd": ["g++", "--version"],
    },
    "java": {
        "name": "Java",
        "extension": ".java",
        "compile": ["javac", "-J-Xmx256M", "-J-Xms64M", "-J-Xss1M", "-J-XX:-UseCompressedOops", "-J-XX:-UseCompressedClassPointers", "-J-XX:ReservedCodeCacheSize=64M", "{file}"],
        "run": ["java", "-Xmx256M", "-Xms64M", "-Xss1M", "-XX:-UseCompressedOops", "-XX:-UseCompressedClassPointers", "-XX:ReservedCodeCacheSize=64M", "-cp", "{dir}", "Main"],
        "version_cmd": ["java", "--version"],
        "filename": "Main.java",
    },
    "go": {
        "name": "Go",
        "extension": ".go",
        "compile": None,
        "run": ["go", "run", "{file}"],
        "version_cmd": ["go", "version"],
    },
    "rust": {
        "name": "Rust",
        "extension": ".rs",
        "compile": ["rustc", "-o", "{output}", "{file}"],
        "run": ["{output}"],
        "version_cmd": ["rustc", "--version"],
    },
    "ruby": {
        "name": "Ruby",
        "extension": ".rb",
        "compile": None,
        "run": ["ruby", "{file}"],
        "version_cmd": ["ruby", "--version"],
    },
    "php": {
        "name": "PHP",
        "extension": ".php",
        "compile": None,
        "run": ["php", "{file}"],
        "version_cmd": ["php", "--version"],
    },
    "perl": {
        "name": "Perl",
        "extension": ".pl",
        "compile": None,
        "run": ["perl", "{file}"],
        "version_cmd": ["perl", "--version"],
    },
    "r": {
        "name": "R",
        "extension": ".r",
        "compile": None,
        "run": ["Rscript", "{file}"],
        "version_cmd": ["R", "--version"],
    },
    "bash": {
        "name": "Bash",
        "extension": ".sh",
        "compile": None,
        "run": ["bash", "{file}"],
        "version_cmd": ["bash", "--version"],
    },
    "lua": {
        "name": "Lua",
        "extension": ".lua",
        "compile": None,
        "run": ["lua", "{file}"],
        "version_cmd": ["lua", "-v"],
    },
    "swift": {
        "name": "Swift",
        "extension": ".swift",
        "compile": None,
        "run": ["swift", "{file}"],
        "version_cmd": ["swift", "--version"],
    },
    "kotlin": {
        "name": "Kotlin",
        "extension": ".kt",
        "compile": ["kotlinc", "-no-daemon", "-J-Xmx256M", "-J-Xms64M", "-J-Xss1M", "-J-XX:-UseCompressedOops", "-J-XX:-UseCompressedClassPointers", "-J-XX:ReservedCodeCacheSize=64M", "{file}", "-include-runtime", "-d", "{output}.jar"],
        "run": ["java", "-Xmx256M", "-Xms64M", "-Xss1M", "-XX:-UseCompressedOops", "-XX:-UseCompressedClassPointers", "-XX:ReservedCodeCacheSize=64M", "-jar", "{output}.jar"],
        "version_cmd": ["kotlinc", "-version"],
    },
    "csharp": {
        "name": "C# (Mono)",
        "extension": ".cs",
        "compile": ["mcs", "-out:{output}.exe", "{file}"],
        "run": ["mono", "{output}.exe"],
        "version_cmd": ["mcs", "--version"],
    },
    "scala": {
        "name": "Scala",
        "extension": ".scala",
        "compile": None,
        "run": ["scala", "-nc", "-J-Xmx256M", "-J-Xms64M", "-J-Xss1M", "-J-XX:-UseCompressedOops", "-J-XX:-UseCompressedClassPointers", "-J-XX:ReservedCodeCacheSize=64M", "{file}"],
        "version_cmd": ["scala", "-version"],
    },
    "haskell": {
        "name": "Haskell (GHC)",
        "extension": ".hs",
        "compile": ["ghc", "-o", "{output}", "{file}"],
        "run": ["{output}"],
        "version_cmd": ["ghc", "--version"],
    },
}

# ─── Resource Limits ──────────────────────────────────────────────────────────

MAX_TIMEOUT = 15  # seconds
MAX_MEMORY_MB = 2048  # MB
MAX_OUTPUT_SIZE = 65536  # characters



def set_resource_limits():
    """Set resource limits for child processes (best-effort on HuggingFace)."""
    try:
        mem_bytes = MAX_MEMORY_MB * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
    except (ValueError, OSError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_CPU, (MAX_TIMEOUT, MAX_TIMEOUT))
    except (ValueError, OSError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_FSIZE, (100 * 1024 * 1024, 100 * 1024 * 1024))
    except (ValueError, OSError):

        pass
    try:
        resource.setrlimit(resource.RLIMIT_NPROC, (256, 256))
    except (ValueError, OSError):

        pass


# ─── Request / Response Models ────────────────────────────────────────────────

class ExecuteRequest(BaseModel):
    language: str = Field(..., description="Language ID (e.g., 'python', 'cpp')")
    code: str = Field(..., description="Source code to execute", max_length=100_000)
    stdin: str = Field("", description="Standard input for the program")
    timeout: int = Field(10, description="Execution timeout in seconds", ge=1, le=MAX_TIMEOUT)
    analyze: bool = Field(False, description="Return static complexity analysis (no code execution)")


class ExecuteResponse(BaseModel):
    stdout: str = ""
    stderr: str = ""
    compile_output: str = ""
    exit_code: Optional[int] = None
    execution_time_ms: float = 0
    memory_used_kb: int = 0
    status: str = "success"  # success | compilation_error | runtime_error | timeout | error
    language: str = ""
    language_name: str = ""
    analysis: Optional[dict] = None


class LanguageInfo(BaseModel):
    id: str
    name: str
    extension: str
    available: bool


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "Uvero Compiler API", "status": "running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/languages", response_model=list[LanguageInfo])
async def list_languages():
    """List all supported languages and their availability."""
    result = []
    for lang_id, config in LANGUAGES.items():
        # Check if the runtime is actually installed
        available = True
        try:
            cmd = config["version_cmd"]
            subprocess.run(cmd, capture_output=True, timeout=5)
        except (FileNotFoundError, subprocess.TimeoutExpired):
            available = False

        result.append(LanguageInfo(
            id=lang_id,
            name=config["name"],
            extension=config["extension"],
            available=available,
        ))
    return result


@app.post("/execute", response_model=ExecuteResponse)
async def execute_code(req: ExecuteRequest):
    """Execute code in the specified language."""
    if req.language not in LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {req.language}")

    config = LANGUAGES[req.language]
    response = ExecuteResponse(language=req.language, language_name=config["name"])

    # Create temporary working directory
    work_dir = tempfile.mkdtemp(prefix="uvero_")

    try:
        # Determine filename
        filename = config.get("filename", f"main{config['extension']}")
        file_path = os.path.join(work_dir, filename)
        output_name = "program"
        output_path = os.path.join(work_dir, output_name)

        # Write source code
        with open(file_path, "w") as f:
            f.write(req.code)

        # Helper to substitute placeholders in commands
        def sub(cmd_list):
            return [
                c.replace("{file}", file_path)
                 .replace("{output}", output_path)
                 .replace("{dir}", work_dir)
                for c in cmd_list
            ]

        start_time = time.time()

        # ─── Compilation step (if needed) ─────────────────────────────────
        if config["compile"] is not None:
            compile_cmd = sub(config["compile"])
            try:
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=req.timeout,
                    cwd=work_dir,
                )
                if compile_result.returncode != 0:
                    response.compile_output = compile_result.stderr[:MAX_OUTPUT_SIZE]
                    response.status = "compilation_error"
                    response.exit_code = compile_result.returncode
                    response.execution_time_ms = round((time.time() - start_time) * 1000, 2)
                    return response
                response.compile_output = compile_result.stderr[:MAX_OUTPUT_SIZE] if compile_result.stderr else ""
            except subprocess.TimeoutExpired:
                response.status = "timeout"
                response.stderr = "Compilation timed out"
                response.execution_time_ms = round((time.time() - start_time) * 1000, 2)
                return response
            except FileNotFoundError:
                response.status = "error"
                response.stderr = f"Compiler not found for {config['name']}"
                return response

        # ─── Execution step ───────────────────────────────────────────────
        run_cmd = config.get("run") or config.get("compile")
        if run_cmd is None:
            response.status = "error"
            response.stderr = "No run command configured"
            return response

        run_cmd = sub(run_cmd)

        try:
            run_result = subprocess.run(
                run_cmd,
                input=req.stdin,
                capture_output=True,
                text=True,
                timeout=req.timeout,
                cwd=work_dir,
                preexec_fn=set_resource_limits,
            )
            elapsed = time.time() - start_time

            response.stdout = run_result.stdout[:MAX_OUTPUT_SIZE]
            response.stderr = run_result.stderr[:MAX_OUTPUT_SIZE]
            response.exit_code = run_result.returncode
            response.execution_time_ms = round(elapsed * 1000, 2)

            if run_result.returncode != 0:
                response.status = "runtime_error"
            else:
                response.status = "success"

        except subprocess.TimeoutExpired:
            response.status = "timeout"
            response.stderr = f"Execution timed out ({req.timeout}s limit)"
            response.execution_time_ms = req.timeout * 1000

        except FileNotFoundError:
            response.status = "error"
            response.stderr = f"Runtime not found for {config['name']}"

        except Exception as e:
            response.status = "error"
            response.stderr = str(e)

        # ─── Static complexity analysis (tree-sitter) ────────────────
        if req.analyze:
            if analyze_static_complexity:
                try:
                    analysis = analyze_static_complexity(req.language, req.code)
                    if analysis:
                        response.analysis = analysis
                    else:
                        response.analysis = {
                            "status": "skipped",
                            "reason": "language or parser unavailable",
                        }
                except Exception as e:  # pragma: no cover
                    response.analysis = {"status": "error", "error": str(e)}
            else:
                response.analysis = {
                    "status": "skipped",
                    "reason": f"analyzer dependency not loaded: {ANALYSIS_IMPORT_ERROR}",
                }

    finally:
        # Clean up temp directory
        shutil.rmtree(work_dir, ignore_errors=True)

    return response


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
