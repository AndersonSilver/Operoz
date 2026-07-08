from __future__ import annotations

from operoz.alerts.types import AlertContext
from operoz.discord_integration.services.discord_formatting import (
    OPEROZ_EMBED_COLOR,
    OPEROZ_EMBED_COLOR_DANGER,
    OPEROZ_EMBED_COLOR_WARNING,
    build_branded_embed,
)
from operoz.discord_integration.services.text_utils import truncate_for_discord
from operoz.utils.support_criticality import criticality_label
from operoz.utils.user_display import user_display_label

ALERT_TITLE_LABELS: dict[str, str] = {
    "issue_created": "Novo card",
    "due_date_approaching": "Vencimento próximo",
    "due_date_overdue": "Card atrasado",
    "missing_due_date": "Sem data de vencimento",
    "state_change": "Estado alterado",
    "assignee_change": "Responsável alterado",
    "support_ticket_created": "Novo chamado de suporte",
    "support_ticket_accepted": "Chamado aceito",
    "support_sla_approaching": "SLA a expirar",
    "support_sla_breached": "SLA violado",
    "support_ticket_closed": "Chamado encerrado",
}

CONTENT_INTROS: dict[str, str] = {
    "issue_created": "Novo card criado, por favor, verifique.",
    "due_date_approaching": "Um card está próximo do vencimento.",
    "due_date_overdue": "Um card está atrasado.",
    "missing_due_date": "Um card está sem data de vencimento.",
    "state_change": "O estado de um card foi alterado.",
    "assignee_change": "A responsabilidade de um card foi atualizada.",
    "support_ticket_created": ("Novo chamado de suporte criado, será validado junto com as demandas do time."),
    "support_ticket_accepted": "Chamado de suporte aceito e em tratamento.",
    "support_sla_approaching": "O SLA de um chamado de suporte está próximo do limite.",
    "support_sla_breached": "O SLA de um chamado de suporte foi violado.",
    "support_ticket_closed": "Chamado de suporte encerrado.",
}

PRIORITY_LABELS: dict[str, str] = {
    "urgent": "Urgente",
    "high": "Alta",
    "medium": "Média",
    "low": "Baixa",
    "none": "Nenhuma",
}

SUPPORT_ALERT_TYPES = frozenset(
    {
        "support_ticket_created",
        "support_ticket_accepted",
        "support_sla_approaching",
        "support_sla_breached",
        "support_ticket_closed",
    }
)


def build_discord_alert_message(context: AlertContext) -> tuple[str, dict]:
    content = _build_content_intro(context)
    embed = build_discord_alert_embed(context)
    return content, embed


def build_discord_alert_embed(context: AlertContext) -> dict:
    if context.alert_type in SUPPORT_ALERT_TYPES and context.subject.intake_issue is not None:
        return _build_support_embed(context)

    return _build_issue_embed(context)


def _build_issue_embed(context: AlertContext) -> dict:
    issue = context.subject.issue
    identifier = _issue_identifier(issue)
    priority = PRIORITY_LABELS.get(str(issue.priority or "none"), "Nenhuma")
    title = f"[{identifier}] {issue.name}"
    if priority != "Nenhuma":
        title = f"{title} · {priority}"

    embed = build_branded_embed(
        subtitle="Notificação",
        title=title[:256],
        description=_build_issue_bullets(context),
        color=_severity_color(context.alert_type, issue=issue),
        url=context.issue_url,
        footer_extra=_footer_workspace(context),
    )
    embed["author"] = {"name": "Operoz OS"}
    return embed


def _build_support_embed(context: AlertContext) -> dict:
    intake = context.subject.intake_issue
    issue = context.subject.issue
    support = _support_payload(intake)
    external_ref = _external_reference(intake)
    client = support.get("client") or _project_name(issue)
    criticality = support.get("criticality_label") or "—"

    title_parts = ["Suporte"]
    if external_ref:
        title_parts.append(f"[{external_ref}]")
    if client:
        title_parts.append(str(client))
    if criticality and criticality != "—":
        title_parts.append(f"· {criticality}")
    title = " ".join(title_parts)

    embed = build_branded_embed(
        subtitle="Sustentação",
        title=title[:256],
        description=_build_support_bullets(context, support),
        color=_support_color(support.get("criticality")),
        url=context.issue_url,
        footer_extra=_footer_workspace(context),
    )
    author = support.get("reporter") or "Operoz OS"
    embed["author"] = {"name": author[:256]}
    return embed


def _build_content_intro(context: AlertContext) -> str:
    intro = CONTENT_INTROS.get(context.alert_type, "Nova notificação do Operoz.")
    extra = context.extra
    if extra.get("days_until") is not None:
        intro = f"{intro} Vence em {extra['days_until']} dia(s)."
    if extra.get("days_overdue") is not None:
        intro = f"{intro} Atrasado há {extra['days_overdue']} dia(s)."
    if extra.get("minutes_until_sla") is not None:
        intro = f"{intro} SLA expira em {extra['minutes_until_sla']} minuto(s)."
    if extra.get("minutes_overdue") is not None:
        intro = f"{intro} SLA violado há {extra['minutes_overdue']} minuto(s)."
    return intro


def _build_issue_bullets(context: AlertContext) -> str:
    issue = context.subject.issue
    rows: list[tuple[str, str]] = []

    project_name = _project_name(issue)
    if project_name:
        rows.append(("Projeto", project_name))

    state = getattr(issue, "state", None)
    if state and getattr(state, "name", None):
        rows.append(("Estado", state.name))

    assignees = _assignee_label(issue)
    rows.append(("Responsáveis", assignees))

    priority = PRIORITY_LABELS.get(str(issue.priority or "none"), "Nenhuma")
    rows.append(("Prioridade", priority))

    if issue.target_date:
        rows.append(("Vencimento", issue.target_date.strftime("%d/%m/%Y")))

    workspace = getattr(issue, "workspace", None)
    if workspace and getattr(workspace, "name", None) and not _is_brand_workspace(workspace):
        rows.append(("Workspace", workspace.name))

    rows.append(("Resumo", issue.name))

    if context.issue_url:
        rows.append(("Link", f"[Abrir no Operoz]({context.issue_url})"))

    return _format_bullet_list(rows)


def _build_support_bullets(context: AlertContext, support: dict) -> str:
    issue = context.subject.issue
    rows: list[tuple[str, str]] = []

    if support.get("client"):
        rows.append(("Cliente", support["client"]))
    if support.get("criticality_label"):
        rows.append(("Criticidade", support["criticality_label"]))
    rows.append(("Resumo", issue.name))
    if support.get("ticket_number"):
        rows.append(("Número do chamado", support["ticket_number"]))
    if support.get("reporter"):
        rows.append(("Relator", support["reporter"]))
    if support.get("queue"):
        rows.append(("Fila", support["queue"]))
    if support.get("sla_due_at"):
        rows.append(("SLA", support["sla_due_at"]))

    identifier = _issue_identifier(issue)
    rows.append(("Card Operoz", identifier))

    if context.issue_url:
        rows.append(("Link", f"[Abrir no Operoz]({context.issue_url})"))

    return _format_bullet_list(rows)


def _format_bullet_list(rows: list[tuple[str, str]]) -> str:
    lines = [f"• **{label}:** {value}" for label, value in rows if value and value != "—"]
    return truncate_for_discord("\n".join(lines))


def _support_payload(intake) -> dict:
    extra = intake.extra or {}
    support = extra.get("support") or {}
    submission = extra.get("submission") or {}

    client = submission.get("client")
    if not client:
        project = getattr(intake.issue, "project", None) if getattr(intake, "issue", None) else None
        if project and getattr(project, "name", None):
            client = project.name

    reporter = None
    if intake.created_by_id and getattr(intake, "created_by", None):
        reporter = user_display_label(intake.created_by)
    elif intake.source_email:
        reporter = intake.source_email.strip()

    queue = None
    if getattr(intake, "support_queue", None):
        queue = intake.support_queue.name

    sla_due = support.get("sla_due_at")
    if sla_due:
        sla_due = str(sla_due).replace("T", " ")[:16]

    return {
        "client": client,
        "criticality": support.get("criticality"),
        "criticality_label": criticality_label(support.get("criticality")) or None,
        "ticket_number": _format_ticket_number(support.get("ticket_number")),
        "reporter": reporter,
        "queue": queue,
        "sla_due_at": sla_due,
    }


def _format_ticket_number(value) -> str | None:
    if value in (None, ""):
        return None
    text = str(value).strip()
    if text.endswith(".0"):
        text = text[:-2]
    return text


def _external_reference(intake) -> str | None:
    if intake.external_id:
        return str(intake.external_id).strip()
    issue = getattr(intake, "issue", None)
    if issue:
        return _issue_identifier(issue)
    return None


def _issue_identifier(issue) -> str:
    project = getattr(issue, "project", None)
    if project and getattr(project, "identifier", None):
        return f"{project.identifier}-{issue.sequence_id}"
    return f"#{issue.sequence_id}"


def _project_name(issue) -> str | None:
    project = getattr(issue, "project", None)
    if project and getattr(project, "name", None):
        return project.name
    return None


def _assignee_label(issue) -> str:
    assignees = []
    if hasattr(issue, "assignees"):
        assignees = list(issue.assignees.all())
    if not assignees:
        return "—"
    names = []
    for user in assignees[:3]:
        names.append(user_display_label(user))
    if len(assignees) > 3:
        names.append(f"+{len(assignees) - 3}")
    return ", ".join(names)


def _footer_workspace(context: AlertContext) -> str:
    """Workspace no rodapé só quando acrescenta contexto (evita «Operoz OS · Operoz»)."""
    workspace = context.workspace
    if not workspace or _is_brand_workspace(workspace):
        return ""
    return (getattr(workspace, "name", None) or "").strip()


def _is_brand_workspace(workspace) -> bool:
    name = (getattr(workspace, "name", None) or "").strip()
    slug = (getattr(workspace, "slug", None) or "").strip().lower()
    if not name:
        return True
    normalized = name.lower().replace(" ", "")
    return normalized in ("operoz", "operozos") or slug in ("operoz")


def _support_color(criticality: str | None) -> int:
    if criticality in ("p0", "p1"):
        return OPEROZ_EMBED_COLOR_DANGER
    if criticality in ("p2",):
        return OPEROZ_EMBED_COLOR_WARNING
    return OPEROZ_EMBED_COLOR


def _severity_color(alert_type: str, *, issue=None) -> int:
    if alert_type in ("due_date_overdue", "support_sla_breached"):
        return OPEROZ_EMBED_COLOR_DANGER
    if alert_type in ("due_date_approaching", "support_sla_approaching", "missing_due_date"):
        return OPEROZ_EMBED_COLOR_WARNING
    if issue and str(getattr(issue, "priority", "")) in ("urgent", "high"):
        return OPEROZ_EMBED_COLOR_WARNING
    return OPEROZ_EMBED_COLOR
