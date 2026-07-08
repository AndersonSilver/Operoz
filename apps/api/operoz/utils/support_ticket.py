"""Utilitários do módulo de chamados de sustentação (IntakeIssue)."""

from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING, Any

from django.utils.dateparse import parse_datetime
from django.utils import timezone

from operoz.utils.board_support_sla import (
    compute_sla_due_at,
    compute_support_sla_breach,
    get_criticality_duration_minutes,
    parse_iso_datetime,
)
from operoz.utils.support_criticality import criticality_label, is_valid_criticality
from operoz.utils.html_processor import strip_tags

if TYPE_CHECKING:
    from operoz.db.models import BoardIntakeForm, IntakeForm, IntakeIssue, Project

DECLINE_CATEGORIES: frozenset[str] = frozenset(
    {
        "out_of_scope",
        "duplicate",
        "insufficient_info",
        "spam",
        "other",
    }
)

DELETE_REASON_MIN_LENGTH = 5
DEFAULT_SUPPORT_SLA_DAYS = 7


class SupportTicketValidationError(ValueError):
    def __init__(self, message: str, *, field: str | None = None):
        super().__init__(message)
        self.field = field


def format_queue_age(created_at) -> str:
    if created_at is None:
        return ""
    now = timezone.now()
    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())
    delta = now - created_at
    total_minutes = int(delta.total_seconds() // 60)
    if total_minutes < 60:
        return f"{max(total_minutes, 1)}m"
    total_hours = total_minutes // 60
    if total_hours < 48:
        return f"{total_hours}h"
    days = delta.days
    return f"{days}d"


def get_board_support_sla_days(board_id) -> int:
    if not board_id:
        return DEFAULT_SUPPORT_SLA_DAYS
    from operoz.db.models import BoardClient360HealthSettings

    settings = (
        BoardClient360HealthSettings.objects.filter(board_id=board_id, deleted_at__isnull=True)
        .only("support_sla_days")
        .first()
    )
    if settings and settings.support_sla_days:
        return int(settings.support_sla_days)
    return DEFAULT_SUPPORT_SLA_DAYS


def compute_sla(*, created_at, sla_days: int) -> dict[str, Any]:
    if created_at is None:
        return {"sla_days": sla_days, "sla_breached": False, "sla_due_at": None}
    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())
    due_at = created_at + timedelta(days=max(sla_days, 1))
    breached = timezone.now() > due_at
    return {
        "sla_days": sla_days,
        "sla_breached": breached,
        "sla_due_at": due_at.isoformat(),
    }


def _strip_html_for_display(value: str) -> str:
    if "<" in value and ">" in value:
        return strip_tags(value).strip()
    return value


def build_submission_display(
    fields: list[dict[str, Any]] | None, submission: dict[str, Any] | None
) -> list[dict[str, str]]:
    if not fields or not submission:
        return []
    rows: list[dict[str, str]] = []
    for field in fields:
        field_id = field.get("id")
        field_type = field.get("field_type")
        if not field_id or field_type in {"client", "attachment", "sla_due"}:
            continue
        raw = submission.get(field_id)
        if raw in (None, "", []):
            continue
        label = field.get("label") or field.get("field_type") or field_id
        if field_type == "criticality":
            value = criticality_label(str(raw)) if is_valid_criticality(str(raw)) else str(raw)
        elif field_type == "ticket_number":
            value = str(raw).strip()
        elif field_type == "datetime":
            parsed = parse_iso_datetime(str(raw))
            if parsed:
                local = timezone.localtime(parsed)
                value = local.strftime("%d/%m/%Y %H:%M")
            else:
                value = str(raw)
        elif isinstance(raw, list):
            value = ", ".join(str(item) for item in raw)
        else:
            value = str(raw)
        if field_type in {"description", "paragraph"} or ("<" in value and ">" in value):
            value = _strip_html_for_display(value)
        rows.append({"label": str(label), "value": value})
    return rows


def enrich_intake_extra(
    *,
    intake_form: IntakeForm | None,
    board_intake_form: BoardIntakeForm | None,
    submission: dict[str, Any] | None,
    fields: list[dict[str, Any]] | None,
    support_extra: dict[str, Any] | None = None,
    board_id=None,
    opened_at=None,
    default_assignee_id=None,
) -> dict[str, Any]:
    extra: dict[str, Any] = {}
    if intake_form:
        extra["form_id"] = str(intake_form.id)
        extra["form_name"] = intake_form.name
    if board_intake_form:
        extra["board_form_id"] = str(board_intake_form.id)
        extra["form_name"] = board_intake_form.name
        extra["form_theme"] = board_intake_form.theme or "default"
    if submission:
        extra["submission"] = submission
    display = build_submission_display(fields, submission or {})
    if display:
        extra["submission_fields"] = display

    if support_extra or board_intake_form is not None:
        support: dict[str, Any] = dict(support_extra or {})
        criticality = support.get("criticality")
        if criticality and not support.get("sla_due_at"):
            duration = get_criticality_duration_minutes(board_id, criticality)
            reference = opened_at or timezone.now()
            if duration and reference:
                due = compute_sla_due_at(opened_at=reference, duration_minutes=duration)
                support["sla_due_at"] = due.isoformat()
                support["sla_due_at_original"] = support["sla_due_at"]
                support["sla_due_at_overridden"] = bool(support.get("sla_due_at_overridden"))
        if default_assignee_id:
            support["assignee_from_project"] = str(default_assignee_id)
        extra["support"] = support

    return extra


def get_support_namespace(extra: dict[str, Any] | None) -> dict[str, Any]:
    if not extra:
        return {}
    support = extra.get("support")
    return support if isinstance(support, dict) else {}


def compute_support_metrics(extra: dict[str, Any] | None, created_at) -> dict[str, int | None]:
    support = get_support_namespace(extra)
    if support.get("metrics") and isinstance(support["metrics"], dict):
        cached = support["metrics"]
        if cached.get("time_to_resolve_seconds") is not None:
            return {
                "time_to_accept_seconds": cached.get("time_to_accept_seconds"),
                "time_to_resolve_seconds": cached.get("time_to_resolve_seconds"),
                "time_in_progress_seconds": cached.get("time_in_progress_seconds"),
            }

    accepted_at = parse_iso_datetime((extra or {}).get("accepted_at"))
    closed_at = parse_iso_datetime((extra or {}).get("closed_at"))
    opened = created_at
    if opened and timezone.is_naive(opened):
        opened = timezone.make_aware(opened, timezone.get_current_timezone())

    tta = None
    ttr = None
    tip = None
    if opened and accepted_at:
        tta = max(0, int((accepted_at - opened).total_seconds()))
    if opened and closed_at:
        ttr = max(0, int((closed_at - opened).total_seconds()))
    if accepted_at and closed_at:
        tip = max(0, int((closed_at - accepted_at).total_seconds()))
    return {
        "time_to_accept_seconds": tta,
        "time_to_resolve_seconds": ttr,
        "time_in_progress_seconds": tip,
    }


def apply_support_field_updates(
    instance: IntakeIssue,
    *,
    criticality: str | None = None,
    sla_due_at: str | None = None,
    reset_sla_from_criticality: bool = False,
    ticket_number: str | None = None,
    actor_id: str | None = None,
) -> None:
    extra = dict(instance.extra or {})
    support = dict(get_support_namespace(extra))
    board_id = getattr(getattr(instance, "project", None), "board_id", None)
    opened_at = instance.created_at

    if ticket_number is not None:
        support["ticket_number"] = ticket_number.strip()[:64]

    if criticality is not None:
        if not is_valid_criticality(criticality):
            raise SupportTicketValidationError("Invalid criticality.", field="criticality")
        previous = support.get("criticality")
        support["criticality"] = criticality
        if previous != criticality:
            support.setdefault("criticality_history", []).append(
                {
                    "from": previous,
                    "to": criticality,
                    "at": timezone.now().isoformat(),
                    "by": actor_id,
                }
            )
        if reset_sla_from_criticality:
            support["sla_due_at_overridden"] = False
        if not support.get("sla_due_at_overridden"):
            duration = get_criticality_duration_minutes(board_id, criticality)
            if duration and opened_at:
                due = compute_sla_due_at(opened_at=opened_at, duration_minutes=duration)
                support["sla_due_at"] = due.isoformat()
                if not support.get("sla_due_at_original"):
                    support["sla_due_at_original"] = support["sla_due_at"]

    if sla_due_at is not None:
        parsed = parse_iso_datetime(sla_due_at)
        if not parsed:
            raise SupportTicketValidationError("Invalid SLA datetime.", field="sla_due_at")
        if not support.get("sla_due_at_original"):
            support["sla_due_at_original"] = support.get("sla_due_at")
        support["sla_due_at"] = parsed.isoformat()
        support["sla_due_at_overridden"] = True

    extra["support"] = support
    instance.extra = extra

    if criticality is not None or sla_due_at is not None or reset_sla_from_criticality:
        from django.db import transaction

        from operoz.bgtasks.alert_dispatch_task import sync_support_sla_calendar_events

        intake_id = str(instance.id)
        transaction.on_commit(lambda: sync_support_sla_calendar_events.delay(intake_id))


def finalize_support_metrics(instance: IntakeIssue) -> None:
    if instance.status != 3:
        return
    extra = dict(instance.extra or {})
    support = dict(get_support_namespace(extra))
    metrics = compute_support_metrics(extra, instance.created_at)
    support["metrics"] = metrics
    extra["support"] = support
    instance.extra = extra


def validate_decline(*, status: int | None, decline_reason: str | None, decline_category: str | None) -> None:
    if status != -1:
        return
    category = (decline_category or "").strip()
    reason = (decline_reason or "").strip()
    if category not in DECLINE_CATEGORIES:
        raise SupportTicketValidationError("Invalid decline category.", field="decline_category")
    if len(reason) < 3:
        raise SupportTicketValidationError("Decline reason is required.", field="decline_reason")


def validate_delete_reason(reason: str | None) -> str:
    cleaned = (reason or "").strip()
    if len(cleaned) < DELETE_REASON_MIN_LENGTH:
        raise SupportTicketValidationError("Delete reason is required.", field="delete_reason")
    return cleaned


def resolve_project_support_queue(*, project: Project, queue_id: str | None):
    from operoz.db.models import BoardSupportQueue

    if not queue_id:
        raise SupportTicketValidationError("Queue is required.", field="queue_id")
    if not project.board_id:
        raise SupportTicketValidationError("Project has no board.", field="queue_id")
    queue = BoardSupportQueue.objects.filter(
        pk=queue_id,
        board_id=project.board_id,
        deleted_at__isnull=True,
    ).first()
    if not queue:
        raise SupportTicketValidationError("Invalid queue.", field="queue_id")
    return queue


def validate_accept(*, status: int | None, queue_id: str | None, project: Project) -> None:
    if status != 1:
        return
    resolve_project_support_queue(project=project, queue_id=queue_id)


def validate_close(*, status: int | None, current_status: int) -> None:
    if status != 3:
        return
    if current_status != 1:
        raise SupportTicketValidationError("Only in-progress tickets can be closed.", field="status")


def validate_move_queue(*, queue_id: str | None, current_status: int, project: Project) -> None:
    if queue_id is None:
        return
    if current_status != 1:
        raise SupportTicketValidationError("Can only move queue for in-progress tickets.", field="queue_id")
    resolve_project_support_queue(project=project, queue_id=queue_id)


def apply_triage_extra_updates(
    instance: IntakeIssue,
    *,
    status: int | None = None,
    decline_reason: str | None = None,
    decline_category: str | None = None,
    snooze_reason: str | None = None,
    reopen: bool = False,
    actor_id: str | None = None,
    resolution_note: str | None = None,
) -> None:
    extra = dict(instance.extra or {})

    if reopen and status == -2:
        extra.pop("decline_reason", None)
        extra.pop("decline_category", None)
        extra.pop("declined_at", None)
        extra.pop("declined_by", None)
        extra.pop("accepted_at", None)
        extra.pop("accepted_by", None)
        extra.pop("closed_at", None)
        extra.pop("closed_by", None)
        extra.pop("resolution_note", None)
        extra["reopened_at"] = timezone.now().isoformat()
        if actor_id:
            extra["reopened_by"] = str(actor_id)
        instance.support_queue_id = None

    if status == -1:
        validate_decline(status=status, decline_reason=decline_reason, decline_category=decline_category)
        extra["decline_reason"] = (decline_reason or "").strip()
        extra["decline_category"] = (decline_category or "").strip()
        extra["declined_at"] = timezone.now().isoformat()
        if actor_id:
            extra["declined_by"] = str(actor_id)

    if status == 0 and snooze_reason:
        extra["snooze_reason"] = snooze_reason.strip()

    if status == 1:
        extra["accepted_at"] = timezone.now().isoformat()
        if actor_id:
            extra["accepted_by"] = str(actor_id)
        extra.pop("closed_at", None)
        extra.pop("closed_by", None)
        extra.pop("resolution_note", None)

    if status == 3:
        extra["closed_at"] = timezone.now().isoformat()
        if actor_id:
            extra["closed_by"] = str(actor_id)
        if resolution_note and resolution_note.strip():
            extra["resolution_note"] = resolution_note.strip()
        support = dict(get_support_namespace(extra))
        metrics = compute_support_metrics(extra, instance.created_at)
        support["metrics"] = metrics
        extra["support"] = support

    instance.extra = extra


def resolve_form_context(intake_issue: IntakeIssue) -> tuple[str | None, str | None, list[dict[str, Any]]]:
    form_name = None
    form_theme = None
    fields: list[dict[str, Any]] = []
    extra = intake_issue.extra or {}

    if intake_issue.board_intake_form_id and intake_issue.board_intake_form:
        form = intake_issue.board_intake_form
        form_name = form.name
        form_theme = form.theme or "default"
        fields = form.fields or []
    elif intake_issue.intake_form_id and intake_issue.intake_form:
        form = intake_issue.intake_form
        form_name = form.name
        form_theme = "default"
        fields = form.fields or []

    form_name = extra.get("form_name") or form_name
    form_theme = extra.get("form_theme") or form_theme
    return form_name, form_theme, fields


def _resolve_actor_label(user_id: str | None) -> str | None:
    if not user_id:
        return None
    from operoz.db.models import User

    user = User.objects.filter(id=user_id).only("display_name", "email").first()
    if not user:
        return None
    label = (user.display_name or "").strip()
    if label:
        return label
    email = (user.email or "").strip()
    return email or None


def serialize_support_ticket_metadata(intake_issue: IntakeIssue, project: Project | None = None) -> dict[str, Any]:
    project = project or intake_issue.project
    extra = intake_issue.extra or {}
    form_name, form_theme, fields = resolve_form_context(intake_issue)
    submission = extra.get("submission") or {}
    submission_fields = extra.get("submission_fields") or build_submission_display(fields, submission)

    board_id = getattr(project, "board_id", None) if project else None
    support = get_support_namespace(extra)
    sla_days = get_board_support_sla_days(board_id)
    sla_due_at = parse_iso_datetime(support.get("sla_due_at"))
    legacy_sla = compute_sla(created_at=intake_issue.created_at, sla_days=sla_days) if not sla_due_at else {}
    sla_breached = compute_support_sla_breach(
        sla_due_at=sla_due_at,
        status=intake_issue.status,
        closed_at=parse_iso_datetime(extra.get("closed_at")),
        legacy_sla_days=sla_days if not support.get("criticality") else None,
        opened_at=intake_issue.created_at,
    )
    metrics = compute_support_metrics(extra, intake_issue.created_at)

    queue_payload = None
    if getattr(intake_issue, "support_queue_id", None) and getattr(intake_issue, "support_queue", None):
        queue = intake_issue.support_queue
        queue_payload = {
            "id": str(queue.id),
            "name": queue.name,
            "slug": queue.slug,
            "color": queue.color,
        }

    age_reference = intake_issue.created_at
    if intake_issue.status == 1 and extra.get("accepted_at"):
        parsed = parse_datetime(extra["accepted_at"])
        if parsed:
            age_reference = parsed
    queue_age_label = format_queue_age(age_reference)

    opened_by_label = _resolve_actor_label(str(intake_issue.created_by_id)) if intake_issue.created_by_id else None
    if not opened_by_label and intake_issue.source_email:
        opened_by_label = intake_issue.source_email.strip() or None

    return {
        "form_name": form_name,
        "form_theme": form_theme,
        "source_email": intake_issue.source_email,
        "submission_fields": submission_fields,
        "queue_age_label": queue_age_label,
        "queue": queue_payload,
        "accepted_at": extra.get("accepted_at"),
        "closed_at": extra.get("closed_at"),
        "declined_at": extra.get("declined_at"),
        "opened_by_label": opened_by_label,
        "accepted_by_label": _resolve_actor_label(extra.get("accepted_by")),
        "closed_by_label": _resolve_actor_label(extra.get("closed_by")),
        "declined_by_label": _resolve_actor_label(extra.get("declined_by")),
        "reopened_by_label": _resolve_actor_label(extra.get("reopened_by")),
        "resolution_note": extra.get("resolution_note"),
        "decline_reason": extra.get("decline_reason"),
        "decline_category": extra.get("decline_category"),
        "snooze_reason": extra.get("snooze_reason"),
        "client_project_name": project.name if project else None,
        "client_project_identifier": project.identifier if project else None,
        "criticality": support.get("criticality"),
        "criticality_label": criticality_label(support.get("criticality")),
        "problem_started_at": support.get("problem_started_at"),
        "ticket_number": support.get("ticket_number"),
        "sla_due_at": support.get("sla_due_at") or legacy_sla.get("sla_due_at"),
        "sla_due_at_overridden": bool(support.get("sla_due_at_overridden")),
        "sla_days": sla_days,
        "sla_breached": sla_breached,
        "metrics": metrics,
    }


def build_delete_audit_payload(*, reason: str, actor_id: str, intake_issue: IntakeIssue) -> dict[str, Any]:
    return {
        "delete_reason": reason,
        "deleted_by": str(actor_id),
        "deleted_at": timezone.now().isoformat(),
        "intake_issue_id": str(intake_issue.id),
        "issue_id": str(intake_issue.issue_id),
    }
