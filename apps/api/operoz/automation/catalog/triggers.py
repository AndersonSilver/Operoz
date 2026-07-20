from __future__ import annotations

from typing import Any

from operoz.automation.catalog.registry import CatalogEntry, catalog
from operoz.automation.domain import DomainEvent


def _matches_issue_event(event: DomainEvent, config: dict[str, Any]) -> bool:
    expected = config.get("event_type")
    if expected and event.event_type != expected:
        return False
    return event.entity_type == "issue"


def _matches_intake_event(event: DomainEvent, config: dict[str, Any]) -> bool:
    expected = config.get("event_type")
    if expected and event.event_type != expected:
        return False
    return event.entity_type == "issue" and event.event_type.startswith("intake.")


def _matches_prd_review_event(event: DomainEvent, config: dict[str, Any]) -> bool:
    expected = config.get("event_type")
    if expected and event.event_type != expected:
        return False
    return event.entity_type == "page_review_session"


def _matches_schedule_event(event: DomainEvent, config: dict[str, Any]) -> bool:
    return event.event_type == "schedule.cron" and event.entity_type == "schedule"


def register_triggers() -> None:
    triggers = [
        ("issue.created", "Card criado", "Dispara quando um card é criado no board."),
        ("issue.updated", "Card atualizado", "Dispara quando um card é alterado."),
        ("issue.state_changed", "Estado alterado", "Dispara quando o estado do card muda."),
        ("issue.assignee_changed", "Responsável alterado", "Dispara quando assignees mudam."),
        ("issue.comment.created", "Comentário criado", "Dispara quando um comentário é adicionado."),
        ("issue.status_report.created", "Status report criado", "Dispara quando um status report é publicado."),
        (
            "intake.submitted",
            "Recepção — pedido recebido",
            "Dispara quando um item entra na recepção (formulário ou in-app).",
        ),
        (
            "intake.converted",
            "Recepção — pedido convertido",
            "Dispara quando um pedido é convertido em card de delivery (mesmo projeto ou cross-project).",
        ),
        (
            "intake.rejected",
            "Recepção — pedido recusado",
            "Dispara quando um pedido é recusado com justificativa.",
        ),
        (
            "intake.deferred",
            "Recepção — pedido não priorizado",
            "Dispara quando um pedido é marcado como não priorizado (adiado).",
        ),
        (
            "intake.consulting",
            "Recepção — resolvido via consultoria",
            "Dispara quando um pedido é encerrado como consultoria sem gerar delivery.",
        ),
        (
            "intake.needs_info",
            "Recepção — aguardando complemento",
            "Dispara quando a triagem solicita informações adicionais ao solicitante.",
        ),
        (
            "prd_review.feedback_submitted",
            "PRD Review — feedback enviado",
            "Dispara quando o cliente envia feedback (alterações solicitadas) numa sessão PRD Review.",
        ),
    ]
    for key, label, description in triggers:
        if key.startswith("prd_review."):
            handler = _matches_prd_review_event
        elif key.startswith("intake.") and key != "intake.submitted":
            handler = _matches_intake_event
        else:
            handler = _matches_issue_event
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
                handler=handler,
            )
        )

    catalog.register(
        CatalogEntry(
            key="schedule.cron",
            kind="trigger",
            label="Agendamento (cron)",
            description="Dispara o fluxo em horários fixos, como um cron job.",
            icon="clock",
            config_schema={
                "type": "object",
                "properties": {
                    "preset": {"type": "string"},
                    "time": {"type": "string"},
                    "weekdays": {"type": "array", "items": {"type": "integer"}},
                    "day_of_month": {"type": "integer"},
                    "cron": {"type": "string"},
                    "timezone": {"type": "string"},
                },
                "required": ["preset", "timezone"],
            },
            handler=_matches_schedule_event,
        )
    )
