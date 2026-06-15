from __future__ import annotations

from typing import Any

from operis.automation.catalog.registry import CatalogEntry, catalog
from operis.automation.domain import DomainEvent
from operis.automation.llm_decision import DEFAULT_CONFIDENCE_THRESHOLD, evaluate_llm_decision


def evaluate_decision_branch(
    event: DomainEvent,
    config: dict[str, Any],
    context: dict[str, Any],
) -> str | None:
    """Avalia ramos em ordem; retorna o id do primeiro que passar. 'decision.else' fica por último."""
    branches = config.get("branches") or []
    else_branch_id: str | None = None

    for branch in branches:
        branch_id = branch.get("id")
        filter_key = branch.get("filter_key") or ""
        if filter_key == "decision.else":
            else_branch_id = branch_id
            continue
        entry = catalog.get(filter_key)
        if not entry or not entry.handler:
            continue
        if entry.handler(event, branch.get("filter_config") or {}, context):
            return branch_id

    return else_branch_id


def register_decisions() -> None:
    catalog.register(
        CatalogEntry(
            key="decision.switch",
            kind="decision",
            label="Tomada de decisão",
            description="Avalia condições em sequência e segue apenas o ramo correspondente.",
            icon="git-branch",
            config_schema={
                "type": "object",
                "properties": {
                    "branches": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "label": {"type": "string"},
                                "filter_key": {"type": "string"},
                                "filter_config": {"type": "object"},
                            },
                            "required": ["id", "label", "filter_key"],
                        },
                    },
                },
            },
            handler=evaluate_decision_branch,
        )
    )

    catalog.register(
        CatalogEntry(
            key="decision.llm",
            kind="decision",
            label="Decisão LLM",
            description="Classifica o evento via LLM com score de confiança; ramo humano se abaixo do threshold.",
            icon="sparkles",
            config_schema={
                "type": "object",
                "properties": {
                    "prompt": {"type": "string"},
                    "confidence_threshold": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 100,
                        "default": DEFAULT_CONFIDENCE_THRESHOLD,
                    },
                    "human_branch_id": {"type": "string"},
                    "branches": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "label": {"type": "string"},
                                "description": {"type": "string"},
                            },
                            "required": ["id", "label"],
                        },
                    },
                },
            },
            handler=evaluate_llm_decision,
        )
    )

    catalog.register(
        CatalogEntry(
            key="decision.else",
            kind="filter",
            label="Senão (padrão)",
            description="Ramificação executada quando nenhuma condição anterior passou.",
            icon="corner-down-right",
            config_schema={"type": "object"},
            handler=lambda _e, _c, _ctx: True,
        )
    )
