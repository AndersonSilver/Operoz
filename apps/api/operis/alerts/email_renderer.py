"""Render and send dedicated alert emails."""

from __future__ import annotations

import logging
from typing import Any

from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string

from operis.license.utils.instance_value import get_email_configuration
from operis.utils.email import generate_plain_text_from_html

logger = logging.getLogger(__name__)

ALERT_LABELS = {
    "issue_created": "Novo card criado",
    "due_date_approaching": "Vencimento próximo",
    "due_date_overdue": "Card atrasado",
    "missing_due_date": "Sem data de vencimento",
    "state_change": "Estado alterado",
    "assignee_change": "Responsável alterado",
    "support_ticket_created": "Novo ticket de sustentação",
    "support_ticket_accepted": "Ticket aceito",
    "support_sla_approaching": "SLA próximo do limite",
    "support_sla_breached": "SLA violado",
    "support_ticket_closed": "Ticket encerrado",
}


def build_alert_email_context(*, issue, alert_type: str, issue_url: str, extra: dict[str, Any]) -> dict[str, Any]:
    project = issue.project
    identifier = f"{project.identifier}-{issue.sequence_id}" if project else str(issue.sequence_id)
    headline = ALERT_LABELS.get(alert_type, alert_type.replace("_", " ").title())
    detail_lines: list[str] = []

    if extra.get("days_until") is not None:
        detail_lines.append(f"Vence em {extra['days_until']} dia(s)")
    if extra.get("days_overdue") is not None:
        detail_lines.append(f"Atrasado há {extra['days_overdue']} dia(s)")
    if extra.get("minutes_until_sla") is not None:
        detail_lines.append(f"SLA em {extra['minutes_until_sla']} minuto(s)")
    if extra.get("minutes_overdue") is not None:
        detail_lines.append(f"SLA violado há {extra['minutes_overdue']} minuto(s)")
    if extra.get("threshold_minutes") is not None:
        detail_lines.append(f"Limite: {extra['threshold_minutes']} min")

    return {
        "headline": headline,
        "alert_type": alert_type,
        "issue_name": issue.name,
        "issue_identifier": identifier,
        "issue_url": issue_url,
        "project_name": project.name if project else "",
        "workspace_slug": issue.workspace.slug if issue.workspace_id else "",
        "detail_lines": detail_lines,
        "extra": extra,
    }


def render_alert_email(*, context: dict[str, Any]) -> tuple[str, str, str]:
    subject = f"[Operoz] {context['headline']} — {context['issue_identifier']}"
    html_content = render_to_string("emails/alerts/alert.html", context)
    text_content = generate_plain_text_from_html(html_content)
    return subject, html_content, text_content


def send_alert_email_sync(*, to_email: str, context: dict[str, Any]) -> None:
    subject, html_content, text_content = render_alert_email(context=context)
    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_USE_SSL,
        EMAIL_FROM,
    ) = get_email_configuration()

    connection = get_connection(
        host=EMAIL_HOST,
        port=int(EMAIL_PORT),
        username=EMAIL_HOST_USER,
        password=EMAIL_HOST_PASSWORD,
        use_tls=EMAIL_USE_TLS == "1",
        use_ssl=EMAIL_USE_SSL == "1",
    )
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=EMAIL_FROM,
        to=[to_email],
        connection=connection,
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send()
    logger.info("Alert email sent to %s", to_email)


def render_digest_email(*, user_name: str, items: list[dict[str, Any]], workspace_slug: str) -> tuple[str, str, str]:
    subject = f"[Operoz] Resumo diário de alertas ({len(items)})"
    context = {"user_name": user_name, "items": items, "workspace_slug": workspace_slug}
    html_content = render_to_string("emails/alerts/digest.html", context)
    text_content = generate_plain_text_from_html(html_content)
    return subject, html_content, text_content
