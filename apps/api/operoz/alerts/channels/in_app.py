from __future__ import annotations

from operoz.alerts.channels.base import BaseAlertChannel
from operoz.alerts.types import AlertContext, AlertResult
from operoz.db.models import Notification


class InAppChannel(BaseAlertChannel):
    channel_type = "in_app"

    def send(self, context: AlertContext) -> AlertResult:
        issue = context.subject.issue
        title = _build_title(context.alert_type, issue.name)
        message = _build_message(context)
        try:
            Notification.objects.create(
                workspace=context.workspace,
                project=issue.project,
                receiver=context.user,
                triggered_by=issue.created_by,
                entity_identifier=issue.id,
                entity_name="issue",
                title=title,
                message={"alert_type": context.alert_type, **context.extra},
                message_stripped=message,
                sender=f"alert:{context.alert_type}",
            )
            return AlertResult(success=True)
        except Exception as exc:
            return AlertResult(success=False, error=str(exc))


def _build_title(alert_type: str, issue_name: str) -> str:
    labels = {
        "issue_created": "Novo card criado",
        "due_date_approaching": "Vencimento próximo",
        "due_date_overdue": "Card atrasado",
        "missing_due_date": "Card sem data de vencimento",
        "state_change": "Estado alterado",
        "assignee_change": "Responsável alterado",
        "support_ticket_created": "Novo chamado de suporte",
        "support_ticket_accepted": "Chamado aceito",
        "support_sla_approaching": "SLA do chamado a expirar",
        "support_sla_breached": "SLA do chamado violado",
        "support_ticket_closed": "Chamado encerrado",
    }
    prefix = labels.get(alert_type, "Alerta")
    return f"{prefix}: {issue_name}"


def _build_message(context: AlertContext) -> str:
    issue = context.subject.issue
    if context.extra.get("days_until") is not None:
        return f"{issue.name} vence em {context.extra['days_until']} dia(s)."
    if context.extra.get("days_overdue") is not None:
        return f"{issue.name} está atrasado há {context.extra['days_overdue']} dia(s)."
    if context.extra.get("minutes_until_sla") is not None:
        return f"SLA do chamado expira em {context.extra['minutes_until_sla']} minuto(s)."
    if context.extra.get("minutes_overdue") is not None:
        return f"SLA do chamado violado há {context.extra['minutes_overdue']} minuto(s)."
    return issue.name
