from __future__ import annotations

from typing import Any, Callable

from operoz.assistant.types import AssistantActorContext, ToolResult

ToolHandler = Callable[[AssistantActorContext, dict[str, Any]], ToolResult]

_TOOLS: dict[str, dict[str, Any]] = {}
_HANDLERS: dict[str, ToolHandler] = {}


def register_tool(
    name: str,
    *,
    description: str,
    parameters: dict[str, Any],
    handler: ToolHandler,
) -> None:
    _TOOLS[name] = {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": parameters,
        },
    }
    _HANDLERS[name] = handler


def list_openai_tools(tool_names: set[str] | frozenset[str] | None = None) -> list[dict[str, Any]]:
    if not tool_names:
        return list(_TOOLS.values())
    allowed = set(tool_names)
    return [spec for name, spec in _TOOLS.items() if name in allowed]


def execute_tool(ctx: AssistantActorContext, name: str, arguments: dict[str, Any]) -> ToolResult:
    handler = _HANDLERS.get(name)
    if not handler:
        return ToolResult(ok=False, error="unknown_tool")
    try:
        return handler(ctx, arguments)
    except Exception:
        return ToolResult(ok=False, error="tool_execution_failed")
