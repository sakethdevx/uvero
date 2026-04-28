"""
Static (no-execution) time/space complexity estimation using Tree-sitter.
Lightweight heuristics: counts loop depth, detects self-recursion, and
flags collection allocations. Designed to be fast and safe inside serverless
execution (milliseconds). If Tree-sitter or grammars are unavailable, returns
`None` so callers can fall back or skip.
"""

from __future__ import annotations

from typing import Dict, Optional

try:
    from tree_sitter import Language, Parser  # type: ignore
    from tree_sitter_languages import get_language  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    Language = None  # type: ignore
    Parser = None  # type: ignore
    get_language = None  # type: ignore


SUPPORTED = {
    "python": "python",
    "py": "python",
    "javascript": "javascript",
    "js": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "java": "java",
    "c": "c",
    "cpp": "cpp",
    "c++": "cpp",
}


def _parser(lang: str) -> Optional[Parser]:
    if Language is None or get_language is None:
        return None
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


def _walk(node, lang: str, ctx: Dict[str, int]):
    """DFS to count loop nesting, recursion, and allocations."""
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

    # Track recursion: when visiting call_expression whose identifier matches current function
    if node.type == "function_definition" or node.type == "method_declaration" or node.type == "function_declaration":
        name_child = None
        for c in node.children:
            if c.type in {"identifier", "field_identifier"}:
                name_child = c
                break
        if name_child:
            ctx.setdefault("func_stack", []).append(_node_text(name_child))
    elif node.type == "call" or node.type == "call_expression":
        if ctx.get("func_stack"):
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

    if node.type in {"function_definition", "method_declaration", "function_declaration"}:
        if ctx.get("func_stack"):
            ctx["func_stack"].pop()


def _find_identifier(node):
    for child in node.children:
        if child.type in {"identifier", "field_identifier"}:
            return _node_text(child)
    return None


def _node_text(node):
    # Tree-sitter nodes keep byte slices; defer to repr
    return getattr(node, "text", b"").decode(errors="ignore") if hasattr(node, "text") else ""


def analyze_static_complexity(language: str, code: str) -> Optional[Dict[str, object]]:
    lang_key = SUPPORTED.get(language.lower())
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

