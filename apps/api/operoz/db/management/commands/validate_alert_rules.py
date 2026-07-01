"""Validate alert rule types: config, dispatch paths, and evaluator smoke checks."""

from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import patch

from django.core.management.base import BaseCommand
from django.utils import timezone

from operoz.alerts.evaluator import (
    evaluate_due_approaching,
    evaluate_no_due_date,
    evaluate_overdue,
    evaluate_support_sla_approaching,
    evaluate_support_sla_breached,
)
from operoz.alerts.types import AlertResult
from operoz.bgtasks.alert_dispatch_task import (
    dispatch_alert,
    dispatch_creation_alert,
    dispatch_issue_update_alerts,
    dispatch_support_alert,
)
from operoz.db.models import AlertLog, AlertRule, IntakeIssue, Issue, Workspace
from operoz.db.models.intake import IntakeTicketKind

ALL_TYPES = [choice.value for choice in AlertRule.AlertType]

TRIGGER_SOURCES = {
    "issue_created": "Issue create → dispatch_creation_alert",
    "due_date_approaching": "Celery beat → check_due_date_alerts → dispatch_alert",
    "due_date_overdue": "Celery beat → check_due_date_alerts → dispatch_alert",
    "missing_due_date": "Celery beat → check_due_date_alerts → dispatch_alert",
    "state_change": "Issue update → dispatch_issue_update_alerts → dispatch_alert",
    "assignee_change": "Issue update → dispatch_issue_update_alerts → dispatch_alert",
    "support_ticket_created": "Support intake create → schedule_support_alert",
    "support_ticket_accepted": "Intake status → accepted → schedule_support_alert",
    "support_sla_approaching": "Celery beat → check_due_date_alerts → dispatch_support_alert",
    "support_sla_breached": "Celery beat → check_due_date_alerts → dispatch_support_alert",
    "support_ticket_closed": "Intake status → closed → schedule_support_alert",
}


class Command(BaseCommand):
    help = "Validate alert rules for a workspace (dispatch smoke test with mocked channels)."

    def add_arguments(self, parser):
        parser.add_argument("--workspace-slug", default="operoz")

    def handle(self, *args, **options):
        slug = options["workspace_slug"]
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if workspace is None:
            self.stderr.write(self.style.ERROR(f"Workspace '{slug}' not found"))
            return

        rules = AlertRule.objects.filter(workspace_id=workspace.id, deleted_at__isnull=True, enabled=True)
        rules_by_type = {rule.alert_type: rule for rule in rules}

        self.stdout.write(self.style.MIGRATE_HEADING(f"\n=== Regras em '{slug}' ==="))
        for alert_type in ALL_TYPES:
            rule = rules_by_type.get(alert_type)
            if rule is None:
                self.stdout.write(self.style.WARNING(f"  {alert_type}: SEM REGRA ATIVA"))
                continue
            channels = ", ".join(rule.channels or [])
            self.stdout.write(f"  {alert_type}: OK [{channels}] config={rule.config}")

        issue = (
            Issue.objects.filter(workspace_id=workspace.id, deleted_at__isnull=True)
            .select_related("project", "state", "workspace", "created_by")
            .prefetch_related("assignees")
            .first()
        )
        intake = (
            IntakeIssue.objects.filter(
                workspace_id=workspace.id,
                ticket_kind=IntakeTicketKind.SUPPORT,
                deleted_at__isnull=True,
            )
            .select_related("issue", "created_by", "support_queue")
            .first()
        )

        if issue is None:
            self.stderr.write(self.style.ERROR("No issue found for dispatch smoke test"))
            return

        def mock_send(_self, context):
            return AlertResult(success=True)

        dispatch_results: dict[str, int | str] = {}

        with (
            patch("operoz.alerts.channels.email.EmailAlertChannel.send", mock_send),
            patch("operoz.alerts.channels.in_app.InAppChannel.send", mock_send),
            patch("operoz.alerts.channels.discord_dm.DiscordDMChannel.send", mock_send),
            patch("operoz.alerts.channels.gcalendar.GoogleCalendarChannel.send", mock_send),
            patch("operoz.alerts.channels.discord_dm.DiscordDMChannel.validate_account", return_value=True),
            patch("operoz.alerts.channels.gcalendar.GoogleCalendarChannel.validate_account", return_value=True),
            patch("operoz.bgtasks.alert_email_task.send_alert_email.delay"),
            patch("operoz.alerts.throttle.throttle_check", return_value=True),
            patch("operoz.alerts.throttle.rate_limit_check", return_value=True),
            patch(
                "operoz.bgtasks.alert_dispatch_task.dispatch_alert.delay",
                side_effect=lambda **kwargs: dispatch_alert(**kwargs),
            ),
        ):
            if rules_by_type.get("issue_created"):
                dispatch_results["issue_created"] = self._count_logs(
                    lambda: dispatch_creation_alert(
                        str(issue.id),
                        str(workspace.id),
                        actor_id=str(issue.created_by_id) if issue.created_by_id else None,
                    )
                )

            if rules_by_type.get("state_change"):
                dispatch_results["state_change"] = self._count_logs(
                    lambda: dispatch_issue_update_alerts(
                        str(issue.id),
                        before={"state_id": "old"},
                        after={"state_id": "new"},
                    )
                )

            if rules_by_type.get("assignee_change"):
                dispatch_results["assignee_change"] = self._count_logs(
                    lambda: dispatch_issue_update_alerts(
                        str(issue.id),
                        before={"assignee_ids": []},
                        after={"assignee_ids": ["user-1"]},
                    )
                )

            for alert_type, extra in (
                ("due_date_approaching", {"days_until": 3, "threshold": 3}),
                ("due_date_overdue", {"days_overdue": 2}),
                ("missing_due_date", {}),
            ):
                if rules_by_type.get(alert_type):
                    dispatch_results[alert_type] = self._count_logs(
                        lambda at=alert_type, ex=extra: dispatch_alert(str(issue.id), at, ex)
                    )

            if intake is not None:
                for alert_type, extra in (
                    ("support_ticket_created", {}),
                    ("support_ticket_accepted", {}),
                    ("support_ticket_closed", {}),
                    ("support_sla_approaching", {"minutes_until_sla": 30}),
                    ("support_sla_breached", {"minutes_overdue": 5}),
                ):
                    if rules_by_type.get(alert_type):
                        dispatch_results[alert_type] = self._count_logs(
                            lambda at=alert_type, ex=extra: dispatch_support_alert(str(intake.id), at, extra=ex)
                        )
            else:
                for alert_type in (
                    "support_ticket_created",
                    "support_ticket_accepted",
                    "support_ticket_closed",
                    "support_sla_approaching",
                    "support_sla_breached",
                ):
                    if rules_by_type.get(alert_type):
                        dispatch_results[alert_type] = "SKIP (no support intake in DB)"

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Disparo (smoke, canais mockados) ==="))
        for alert_type in ALL_TYPES:
            result = dispatch_results.get(alert_type)
            if result is None:
                if rules_by_type.get(alert_type):
                    self.stdout.write(self.style.WARNING(f"  {alert_type}: não testado"))
                continue
            if isinstance(result, str):
                self.stdout.write(self.style.WARNING(f"  {alert_type}: {result}"))
            elif result > 0:
                self.stdout.write(self.style.SUCCESS(f"  {alert_type}: OK (+{result} logs)"))
            else:
                self.stdout.write(self.style.ERROR(f"  {alert_type}: FALHOU (0 logs — regra/recipients?)"))

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Evaluators (lógica do scan) ==="))
        today = timezone.localdate()
        self.stdout.write(f"  due_date_approaching(hoje): {evaluate_due_approaching(target_date=today, today=today, threshold_days=7)}")
        self.stdout.write(f"  due_date_overdue(ontem): {evaluate_overdue(target_date=today - timedelta(days=1), today=today)}")
        self.stdout.write(
            f"  missing_due_date(5d): {evaluate_no_due_date(target_date=None, created_at=timezone.now() - timedelta(days=5), grace_period_days=3)}"
        )
        if intake is not None:
            self.stdout.write(
                f"  support_sla_approaching: {evaluate_support_sla_approaching(intake, threshold_minutes=99999)}"
            )
            self.stdout.write(f"  support_sla_breached: {evaluate_support_sla_breached(intake)}")

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Origem de cada tipo ==="))
        for alert_type in ALL_TYPES:
            self.stdout.write(f"  {alert_type}: {TRIGGER_SOURCES[alert_type]}")

    @staticmethod
    def _count_logs(fn) -> int:
        before = AlertLog.objects.count()
        fn()
        return AlertLog.objects.count() - before
