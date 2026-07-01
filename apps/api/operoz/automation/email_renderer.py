from __future__ import annotations

import logging
import re
from typing import Any

from django.core.mail import EmailMultiAlternatives

from operoz.license.utils.instance_value import get_instance_smtp_connection
from operoz.utils.email import generate_plain_text_from_html

logger = logging.getLogger(__name__)

PLACEHOLDER_PATTERN = re.compile(r"\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}")


def _resolve_path(data: dict[str, Any], path: str) -> str:
    current: Any = data
    for part in path.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return ""
    if current is None:
        return ""
    return str(current)


def render_template_string(template: str, context: dict[str, Any]) -> str:
    def replacer(match: re.Match[str]) -> str:
        return _resolve_path(context, match.group(1))

    return PLACEHOLDER_PATTERN.sub(replacer, template)


def build_email_context(event, issue, board) -> dict[str, Any]:
    project = getattr(issue, "project", None) if issue else None
    return {
        "event": {
            "type": event.event_type,
            "id": event.event_id,
        },
        "issue": {
            "id": str(issue.id) if issue else "",
            "name": getattr(issue, "name", "") if issue else "",
            "sequence_id": getattr(issue, "sequence_id", "") if issue else "",
            "priority": getattr(issue, "priority", "") if issue else "",
            "state_id": str(getattr(issue, "state_id", "") or "") if issue else "",
        },
        "project": {
            "id": str(project.id) if project else "",
            "name": getattr(project, "name", "") if project else "",
            "identifier": getattr(project, "identifier", "") if project else "",
        },
        "board": {
            "id": str(board.id) if board else "",
            "name": getattr(board, "name", "") if board else "",
        },
    }


def deliver_automation_email(
    *,
    subject_template: str,
    html_template: str,
    to_emails: list[str],
    context: dict[str, Any],
) -> dict[str, Any]:
    """SMTP síncrono — executado apenas no worker da fila automation_email."""
    if not to_emails:
        return {"ok": False, "message": "Nenhum destinatário definido"}

    subject = render_template_string(subject_template, context)
    html_content = render_template_string(html_template, context)
    text_content = generate_plain_text_from_html(html_content)

    try:
        connection, email_from = get_instance_smtp_connection()

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=email_from,
            to=to_emails,
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        return {"ok": True, "message": f"E-mail enviado para {len(to_emails)} destinatário(s)"}
    except Exception as exc:
        logger.exception("automation email send failed")
        return {"ok": False, "message": str(exc)}


def send_automation_email(
    *,
    subject_template: str,
    html_template: str,
    to_emails: list[str],
    context: dict[str, Any],
    dry_run: bool = False,
) -> dict[str, Any]:
    if not to_emails:
        return {"ok": False, "message": "Nenhum destinatário definido"}

    subject = render_template_string(subject_template, context)

    if dry_run:
        return {
            "ok": True,
            "message": f"[dry-run] E-mail para {len(to_emails)} destinatário(s): {subject}",
            "dry_run": True,
        }

    from operoz.bgtasks.automation_email_task import send_automation_email_task

    send_automation_email_task.delay(
        subject_template=subject_template,
        html_template=html_template,
        to_emails=to_emails,
        context=context,
    )
    return {
        "ok": True,
        "queued": True,
        "message": f"E-mail enfileirado para {len(to_emails)} destinatário(s): {subject}",
    }
