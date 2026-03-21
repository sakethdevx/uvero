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
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
        "compile": ["npx", "ts-node", "{file}"],
        "run": None,  # ts-node compiles + runs
        "version_cmd": ["npx", "ts-node", "--version"],
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
        "compile": ["kotlinc", "-J-Xmx256M", "-J-Xms64M", "-J-Xss1M", "-J-XX:-UseCompressedOops", "-J-XX:-UseCompressedClassPointers", "-J-XX:ReservedCodeCacheSize=64M", "{file}", "-include-runtime", "-d", "{output}.jar"],
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
        "run": ["scala", "-J-Xmx256M", "-J-Xms64M", "-J-Xss1M", "-J-XX:-UseCompressedOops", "-J-XX:-UseCompressedClassPointers", "-J-XX:ReservedCodeCacheSize=64M", "{file}"],
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

    finally:
        # Clean up temp directory
        shutil.rmtree(work_dir, ignore_errors=True)

    return response


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
