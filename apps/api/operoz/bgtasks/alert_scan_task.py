from __future__ import annotations

from datetime import date, timedelta

from celery import shared_task
from django.db.models import Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from operoz.alerts.evaluator import (
    evaluate_due_approaching,
    evaluate_no_due_date,
    evaluate_overdue,
    evaluate_support_sla_approaching,
    evaluate_support_sla_breached,
    get_matching_threshold,
    should_dispatch_for_issue,
    support_scan_extra,
)
from operoz.bgtasks.alert_dispatch_task import dispatch_alert, dispatch_support_alert
from operoz.db.models import AlertLog, AlertRule, IntakeIssue, Issue, Notification, Workspace
from operoz.db.models.intake import IntakeIssueStatus, IntakeTicketKind


def _prior_sent_alert_waves(*, issue_id, alert_type: str) -> int:
    """Count distinct calendar days with SENT logs for this issue/type (≈ prior scan waves)."""
    return (
        AlertLog.objects.filter(
            issue_id=issue_id,
            alert_type=alert_type,
            status=AlertLog.Status.SENT,
            deleted_at__isnull=True,
        )
        .annotate(wave_day=TruncDate("created_at"))
        .values("wave_day")
        .distinct()
        .count()
    )


@shared_task
def check_due_date_alerts() -> None:
    today = timezone.localdate()
    now = timezone.now()

    active_workspaces = Workspace.objects.filter(deleted_at__isnull=True)
    for workspace in active_workspaces.iterator(chunk_size=100):
        rules = AlertRule.objects.filter(
            workspace_id=workspace.id,
            enabled=True,
            deleted_at__isnull=True,
            alert_type__in=[
                AlertRule.AlertType.DUE_DATE_APPROACHING,
                AlertRule.AlertType.DUE_DATE_OVERDUE,
                AlertRule.AlertType.MISSING_DUE_DATE,
                AlertRule.AlertType.SUPPORT_SLA_APPROACHING,
                AlertRule.AlertType.SUPPORT_SLA_BREACHED,
                AlertRule.AlertType.ISSUE_NO_ACTIVITY,
                AlertRule.AlertType.IN_PROGRESS_TOO_LONG,
                AlertRule.AlertType.SUPPORT_NO_TEAM_RESPONSE,
            ],
        )
        if not rules.exists():
            continue

        _scan_due_date_issues(workspace.id, rules, today)
        _scan_missing_due_date_issues(workspace.id, rules, now)
        _scan_support_tickets(workspace.id, rules, now)
        _scan_stale_issues(workspace.id, rules, now)
        _scan_in_progress_issues(workspace.id, rules, now)
        _scan_support_no_response(workspace.id, rules, now)

    _check_snoozed_notifications(now)


def _scan_due_date_issues(workspace_id, rules, today: date) -> None:
    approaching_rule = rules.filter(alert_type=AlertRule.AlertType.DUE_DATE_APPROACHING).first()
    overdue_rule = rules.filter(alert_type=AlertRule.AlertType.DUE_DATE_OVERDUE).first()
    max_threshold = 7
    if approaching_rule:
        thresholds = approaching_rule.config.get("thresholds_days") or [7, 3, 1]
        max_threshold = max(thresholds) if thresholds else 7

    issues = (
        Issue.objects.filter(
            workspace_id=workspace_id,
            deleted_at__isnull=True,
            target_date__isnull=False,
        )
        .exclude(state__group__in=["completed", "cancelled"])
        .select_related("project", "state")
        .iterator(chunk_size=500)
    )

    for issue in issues:
        if not should_dispatch_for_issue(issue):
            continue
        if issue.target_date and approaching_rule:
            thresholds = approaching_rule.config.get("thresholds_days") or [7, 3, 1]
            days_until = (issue.target_date - today).days
            if evaluate_due_approaching(target_date=issue.target_date, today=today, threshold_days=max_threshold):
                matched = get_matching_threshold(thresholds, days_until)
                if matched is not None:
                    dispatch_alert.delay(
                        issue_id=str(issue.id),
                        alert_type=AlertRule.AlertType.DUE_DATE_APPROACHING,
                        extra={"days_until": days_until, "threshold": matched},
                    )
        if overdue_rule and issue.target_date and evaluate_overdue(target_date=issue.target_date, today=today):
            dispatch_alert.delay(
                issue_id=str(issue.id),
                alert_type=AlertRule.AlertType.DUE_DATE_OVERDUE,
                extra={"days_overdue": (today - issue.target_date).days},
            )


def _scan_missing_due_date_issues(workspace_id, rules, now) -> None:
    missing_rule = rules.filter(alert_type=AlertRule.AlertType.MISSING_DUE_DATE).first()
    if not missing_rule:
        return
    grace_days = int(missing_rule.config.get("grace_period_days", 3))

    issues = (
        Issue.objects.filter(
            workspace_id=workspace_id,
            deleted_at__isnull=True,
            target_date__isnull=True,
        )
        .exclude(state__group__in=["completed", "cancelled"])
        .select_related("project", "state")
        .iterator(chunk_size=500)
    )

    for issue in issues:
        if evaluate_no_due_date(
            target_date=None,
            created_at=issue.created_at,
            grace_period_days=grace_days,
            now=now,
        ):
            dispatch_alert.delay(
                issue_id=str(issue.id),
                alert_type=AlertRule.AlertType.MISSING_DUE_DATE,
            )


def _scan_support_tickets(workspace_id, rules, now) -> None:
    approaching_rule = rules.filter(alert_type=AlertRule.AlertType.SUPPORT_SLA_APPROACHING).first()
    breached_rule = rules.filter(alert_type=AlertRule.AlertType.SUPPORT_SLA_BREACHED).first()
    if not approaching_rule and not breached_rule:
        return

    threshold_minutes = int((approaching_rule.config.get("threshold_minutes") if approaching_rule else None) or 60)

    intake_issues = (
        IntakeIssue.objects.filter(
            workspace_id=workspace_id,
            ticket_kind=IntakeTicketKind.SUPPORT,
            deleted_at__isnull=True,
        )
        .exclude(status__in=[IntakeIssueStatus.CLOSED, IntakeIssueStatus.REJECTED])
        .select_related("issue", "issue__project", "issue__state")
        .iterator(chunk_size=500)
    )

    for intake_issue in intake_issues:
        issue = intake_issue.issue
        if issue.deleted_at is not None or not should_dispatch_for_issue(issue):
            continue

        if breached_rule and evaluate_support_sla_breached(intake_issue, now=now):
            extra = support_scan_extra(intake_issue, AlertRule.AlertType.SUPPORT_SLA_BREACHED, now=now)
            dispatch_support_alert.delay(
                intake_issue_id=str(intake_issue.id),
                alert_type=AlertRule.AlertType.SUPPORT_SLA_BREACHED,
                extra=extra,
            )
            continue

        if approaching_rule and evaluate_support_sla_approaching(
            intake_issue,
            threshold_minutes=threshold_minutes,
            now=now,
        ):
            extra = support_scan_extra(intake_issue, AlertRule.AlertType.SUPPORT_SLA_APPROACHING, now=now)
            dispatch_support_alert.delay(
                intake_issue_id=str(intake_issue.id),
                alert_type=AlertRule.AlertType.SUPPORT_SLA_APPROACHING,
                extra=extra,
            )


def _scan_stale_issues(workspace_id, rules, now) -> None:
    """Dispatch issue_no_activity for open cards not updated in threshold_days."""
    stale_rule = rules.filter(alert_type=AlertRule.AlertType.ISSUE_NO_ACTIVITY).first()
    if not stale_rule:
        return

    threshold_days = int(stale_rule.config.get("threshold_days", 3))
    cutoff = now - timedelta(days=threshold_days)

    issues = (
        Issue.objects.filter(
            workspace_id=workspace_id,
            deleted_at__isnull=True,
            updated_at__lt=cutoff,
        )
        .exclude(state__group__in=["completed", "cancelled"])
        .select_related("project", "state")
        .iterator(chunk_size=500)
    )

    for issue in issues:
        if not should_dispatch_for_issue(issue):
            continue
        prev_waves = _prior_sent_alert_waves(
            issue_id=issue.id,
            alert_type=AlertRule.AlertType.ISSUE_NO_ACTIVITY,
        )
        dispatch_alert.delay(
            issue_id=str(issue.id),
            alert_type=AlertRule.AlertType.ISSUE_NO_ACTIVITY,
            extra={"days_inactive": (now - issue.updated_at).days},
            escalate=prev_waves >= 3,
        )


def _scan_in_progress_issues(workspace_id, rules, now) -> None:
    """Dispatch in_progress_too_long for cards stuck in 'started' state beyond threshold_days."""
    stuck_rule = rules.filter(alert_type=AlertRule.AlertType.IN_PROGRESS_TOO_LONG).first()
    if not stuck_rule:
        return

    threshold_days = int(stuck_rule.config.get("threshold_days", 5))
    cutoff = now - timedelta(days=threshold_days)

    issues = (
        Issue.objects.filter(
            workspace_id=workspace_id,
            deleted_at__isnull=True,
            state__group="started",
        )
        .filter(
            Q(state_changed_at__lt=cutoff)
            | Q(state_changed_at__isnull=True, updated_at__lt=cutoff)
        )
        .select_related("project", "state")
        .iterator(chunk_size=500)
    )

    for issue in issues:
        if not should_dispatch_for_issue(issue):
            continue
        changed_at = issue.state_changed_at or issue.updated_at
        dispatch_alert.delay(
            issue_id=str(issue.id),
            alert_type=AlertRule.AlertType.IN_PROGRESS_TOO_LONG,
            extra={"days_in_progress": (now - changed_at).days},
        )


def _scan_support_no_response(workspace_id, rules, now) -> None:
    """Dispatch support_no_team_response for accepted tickets with no update in threshold_hours."""
    no_response_rule = rules.filter(alert_type=AlertRule.AlertType.SUPPORT_NO_TEAM_RESPONSE).first()
    if not no_response_rule:
        return

    threshold_hours = int(no_response_rule.config.get("threshold_hours", 4))
    cutoff = now - timedelta(hours=threshold_hours)

    intake_issues = (
        IntakeIssue.objects.filter(
            workspace_id=workspace_id,
            ticket_kind=IntakeTicketKind.SUPPORT,
            status=IntakeIssueStatus.ACCEPTED,
            updated_at__lt=cutoff,
            deleted_at__isnull=True,
        )
        .select_related("issue", "issue__project", "issue__state")
        .iterator(chunk_size=500)
    )

    for intake_issue in intake_issues:
        issue = intake_issue.issue
        if issue.deleted_at is not None or not should_dispatch_for_issue(issue):
            continue
        hours_waiting = int((now - intake_issue.updated_at).total_seconds() / 3600)
        dispatch_support_alert.delay(
            intake_issue_id=str(intake_issue.id),
            alert_type=AlertRule.AlertType.SUPPORT_NO_TEAM_RESPONSE,
            extra={"hours_without_response": hours_waiting},
        )


def _check_snoozed_notifications(now) -> None:
    """Re-dispatch alerts for in-app notifications whose snooze has expired but are still unread."""
    expired = (
        Notification.objects.filter(
            snoozed_till__lte=now,
            read_at__isnull=True,
            archived_at__isnull=True,
            entity_name="issue",
        )
        .select_related("workspace")
        .iterator(chunk_size=500)
    )

    seen_issue_ids: set[str] = set()
    for notif in expired:
        # Clear the snooze so the notification resurfaces in-app
        Notification.objects.filter(pk=notif.pk).update(snoozed_till=None)

        issue_id = str(notif.entity_identifier)
        if issue_id in seen_issue_ids:
            continue
        seen_issue_ids.add(issue_id)

        # Extract the alert_type that was originally triggered
        message = notif.message or {}
        alert_type = message.get("alert_type")
        if not alert_type:
            # Fallback: parse from sender field ("alert:<type>")
            sender = notif.sender or ""
            if sender.startswith("alert:"):
                alert_type = sender[len("alert:"):]

        if not alert_type:
            continue

        dispatch_alert.delay(issue_id=issue_id, alert_type=alert_type)
