from __future__ import annotations

from typing import Any

from operis.automation.catalog.registry import CatalogEntry, catalog
from operis.automation.domain import DomainEvent


def _matches_issue_event(event: DomainEvent, config: dict[str, Any]) -> bool:
    expected = config.get("event_type")
    if expected and event.event_type != expected:
        return False
    return event.entity_type == "issue"


def register_triggers() -> None:
    triggers = [
        ("issue.created", "Card criado", "Dispara quando um card é criado no board."),
        ("issue.updated", "Card atualizado", "Dispara quando um card é alterado."),
        ("issue.state_changed", "Estado alterado", "Dispara quando o estado do card muda."),
        ("issue.assignee_changed", "Responsável alterado", "Dispara quando assignees mudam."),
        ("issue.comment.created", "Comentário criado", "Dispara quando um comentário é adicionado."),
        ("issue.status_report.created", "Status report criado", "Dispara quando um status report é publicado."),
        ("intake.submitted", "Recepção — pedido recebido", "Dispara quando um item entra na recepção (formulário ou in-app)."),
    ]
    for key, label, description in triggers:
        catalog.register(
            CatalogEntry(
                key=key,
                kind="trigger",
                label=label,
                description=description,
                icon="bolt",
                config_schema={
                    "type": "object",
                    "properties": {
                        "event_type": {"type": "string", "const": key},
                    },
                    "required": ["event_type"],
                },
                handler=_matches_issue_event,
            )
        )
