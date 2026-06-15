from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from operis.assistant.intent import AssistantIntent, classify_chat_intent

RouteSurface = Literal["rag", "tools", "action_confirm"]

READ_TOOLS = frozenset(
    {
        "search_issues",
        "get_issue",
        "get_client_360_summary",
        "retrieve_client_360_history",
        "search_pages",
        "search_documentation",
        "get_page_content",
        "get_prd_review_summary",
        "list_board_projects",
        "list_intake_pending",
    }
)

METRICS_TOOLS = frozenset(
    {
        "get_automation_metrics",
        "get_automation_run",
        "get_project_stats",
    }
)

AUTOMATION_TOOLS = frozenset(
    {
        "propose_automation_rule",
        "explain_automation_run",
        "list_automation_packs",
        "propose_automation_pack_install",
        "propose_issue_comment",
        "propose_issue_state_change",
    }
)

CONFIRMATION_TOOLS = frozenset(
    {
        "propose_automation_rule",
        "propose_automation_pack_install",
        "propose_issue_comment",
        "propose_issue_state_change",
    }
)

ALL_TOOLS = READ_TOOLS | METRICS_TOOLS | AUTOMATION_TOOLS

_INTENT_TOOL_MAP: dict[AssistantIntent, frozenset[str]] = {
    "documentation": READ_TOOLS,
    "metrics": READ_TOOLS | METRICS_TOOLS,
    "automation": READ_TOOLS | METRICS_TOOLS | AUTOMATION_TOOLS,
    "general": ALL_TOOLS,
}

_SURFACE_BY_INTENT: dict[AssistantIntent, RouteSurface] = {
    "documentation": "rag",
    "metrics": "tools",
    "automation": "action_confirm",
    "general": "rag",
}


@dataclass(frozen=True)
class ToolRoutePlan:
    intent: AssistantIntent
    surface: RouteSurface
    use_rag: bool
    tool_names: frozenset[str]
    confirmation_tools: frozenset[str]
    hint: str


def build_tool_route_plan(message: str) -> ToolRoutePlan:
    """Roteia intent → RAG, subset de tools e ferramentas que exigem confirmação humana."""
    intent = classify_chat_intent(message)
    tool_names = _INTENT_TOOL_MAP[intent]
    surface = _SURFACE_BY_INTENT[intent]
    use_rag = intent in {"documentation", "general"}
    confirmation = CONFIRMATION_TOOLS & tool_names if surface == "action_confirm" else frozenset()

    hints = {
        "documentation": "Priorize RAG e ferramentas de leitura (páginas, issues).",
        "metrics": "Use ferramentas de métricas e leitura; evite RAG.",
        "automation": "Use ferramentas de automação; ações destrutivas exigem confirmação no chat.",
        "general": "Combine RAG com ferramentas conforme necessário.",
    }

    return ToolRoutePlan(
        intent=intent,
        surface=surface,
        use_rag=use_rag,
        tool_names=tool_names,
        confirmation_tools=confirmation,
        hint=hints[intent],
    )
