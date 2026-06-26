from __future__ import annotations

from celery import shared_task
from django.db.models import Q
from django.utils import timezone

from operis.alerts.access import user_can_receive_issue_alert
from operis.alerts.dispatcher import build_issue_url, dispatch_rule_for_subject
from operis.alerts.services.google_calendar import delete_issue_event, upsert_issue_event
from operis.alerts.types import AlertSubject
from operis.db.models import AlertRule, IntakeIssue, Issue, UserExternalAccount
from operis.db.models.external_account import UserExternalAccount as ExternalAccountModel


@shared_task
def dispatch_creation_alert(issue_id: str, workspace_id: str, actor_id: str | None = None) -> None:
    issue = (
        Issue.objects.select_related("project", "state", "workspace")
        .prefetch_related("assignees")
        .filter(id=issue_id, workspace_id=workspace_id, deleted_at__isnull=True)
        .first()
    )
    if issue is None:
        return

    rules = AlertRule.objects.filter(
        workspace_id=workspace_id,
        alert_type=AlertRule.AlertType.ISSUE_CREATED,
        enabled=True,
        deleted_at__isnull=True,
    ).filter(Q(project__isnull=True) | Q(project_id=issue.project_id))

    subject = AlertSubject(issue=issue)
    for rule in rules:
        dispatch_rule_for_subject(
            rule=rule,
            subject=subject,
            alert_type=AlertRule.AlertType.ISSUE_CREATED,
            actor_id=actor_id,
        )

    if issue.target_date:
        sync_issue_calendar_events.delay(issue_id=str(issue.id))


@shared_task
def dispatch_support_alert(
    intake_issue_id: str,
    alert_type: str,
    actor_id: str | None = None,
    extra: dict | None = None,
) -> None:
    intake_issue = (
        IntakeIssue.objects.select_related("issue", "issue__project", "issue__state", "issue__workspace")
        .prefetch_related("issue__assignees")
        .filter(id=intake_issue_id, deleted_at__isnull=True)
        .first()
    )
    if intake_issue is None:
        return

    issue = intake_issue.issue
    workspace_id = str(issue.workspace_id)
    rules = AlertRule.objects.filter(
        workspace_id=workspace_id,
        alert_type=alert_type,
        enabled=True,
        deleted_at__isnull=True,
    ).filter(Q(project__isnull=True) | Q(project_id=issue.project_id))

    subject = AlertSubject(issue=issue, intake_issue=intake_issue)
    for rule in rules:
        dispatch_rule_for_subject(
            rule=rule,
            subject=subject,
            alert_type=alert_type,
            extra=extra or {},
            actor_id=actor_id,
        )


def _diff_fields(before: dict, after: dict) -> set[str]:
    keys = set(before.keys()) | set(after.keys())
    return {key for key in keys if before.get(key) != after.get(key)}


@shared_task
def sync_issue_calendar_events(issue_id: str) -> None:
    issue = (
        Issue.objects.select_related("project", "workspace")
        .prefetch_related("assignees")
        .filter(id=issue_id, deleted_at__isnull=True)
        .first()
    )
    if issue is None:
        return

    accounts = UserExternalAccount.objects.filter(
        workspace_id=issue.workspace_id,
        provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
        is_active=True,
        deleted_at__isnull=True,
    ).select_related("user")

    issue_url = build_issue_url(issue)
    for account in accounts:
        if not user_can_receive_issue_alert(user=account.user, issue=issue):
            continue
        try:
            if issue.target_date:
                upsert_issue_event(account=account, issue=issue, issue_url=issue_url)
            else:
                delete_issue_event(account=account, issue=issue)
        except Exception:
            continue


@shared_task
def dispatch_issue_update_alerts(
    issue_id: str,
    *,
    actor_id: str | None = None,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    if not before or not after:
        return

    changed = _diff_fields(before, after)
    if "state_id" in changed:
        dispatch_alert.delay(
            issue_id=issue_id,
            alert_type=AlertRule.AlertType.STATE_CHANGE,
            extra={"before_state_id": before.get("state_id"), "after_state_id": after.get("state_id")},
        )
    if "assignee_ids" in changed:
        dispatch_alert.delay(
            issue_id=issue_id,
            alert_type=AlertRule.AlertType.ASSIGNEE_CHANGE,
            extra={"before_assignee_ids": before.get("assignee_ids"), "after_assignee_ids": after.get("assignee_ids")},
        )
    if "target_date" in changed:
        sync_issue_calendar_events.delay(issue_id=issue_id)


@shared_task
def dispatch_alert(issue_id: str, alert_type: str, extra: dict | None = None) -> None:
    issue = (
        Issue.objects.select_related("project", "state", "workspace")
        .prefetch_related("assignees")
        .filter(id=issue_id, deleted_at__isnull=True)
        .first()
    )
    if issue is None:
        return

    workspace_id = str(issue.workspace_id)
    rules = AlertRule.objects.filter(
        workspace_id=workspace_id,
        alert_type=alert_type,
        enabled=True,
        deleted_at__isnull=True,
    ).filter(Q(project__isnull=True) | Q(project_id=issue.project_id))

    intake_issue = (
        IntakeIssue.objects.filter(issue_id=issue.id, deleted_at__isnull=True).order_by("-created_at").first()
    )
    subject = AlertSubject(issue=issue, intake_issue=intake_issue)
    for rule in rules:
        dispatch_rule_for_subject(
            rule=rule,
            subject=subject,
            alert_type=alert_type,
            extra=extra or {},
        )
