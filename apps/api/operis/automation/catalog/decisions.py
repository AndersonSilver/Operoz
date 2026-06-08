from __future__ import annotations

from typing import Any

from operis.automation.catalog.registry import CatalogEntry, catalog
from operis.automation.domain import DomainEvent


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
            key="decision.else",
            kind="filter",
            label="Senão (padrão)",
            description="Ramificação executada quando nenhuma condição anterior passou.",
            icon="corner-down-right",
            config_schema={"type": "object"},
            handler=lambda _e, _c, _ctx: True,
        )
    )
