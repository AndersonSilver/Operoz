from django.conf import settings
from django.db import models

from .base import BaseModel


def default_alert_rule_channels():
    return ["email", "in_app"]


class AlertRule(BaseModel):
    """Configurable alert rule scoped to workspace or project."""

    class AlertType(models.TextChoices):
        ISSUE_CREATED = "issue_created", "Issue Created"
        DUE_DATE_APPROACHING = "due_date_approaching", "Due Date Approaching"
        DUE_DATE_OVERDUE = "due_date_overdue", "Due Date Overdue"
        MISSING_DUE_DATE = "missing_due_date", "Missing Due Date"
        STATE_CHANGE = "state_change", "State Change"
        ASSIGNEE_CHANGE = "assignee_change", "Assignee Change"
        SUPPORT_TICKET_CREATED = "support_ticket_created", "Support Ticket Created"
        SUPPORT_TICKET_ACCEPTED = "support_ticket_accepted", "Support Ticket Accepted"
        SUPPORT_SLA_APPROACHING = "support_sla_approaching", "Support SLA Approaching"
        SUPPORT_SLA_BREACHED = "support_sla_breached", "Support SLA Breached"
        SUPPORT_TICKET_CLOSED = "support_ticket_closed", "Support Ticket Closed"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="alert_rules")
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="alert_rules",
        null=True,
        blank=True,
    )
    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    name = models.CharField(max_length=200, blank=True, default="")
    enabled = models.BooleanField(default=True)
    config = models.JSONField(default=dict)
    channels = models.JSONField(default=default_alert_rule_channels)
    escalation_schedule = models.JSONField(default=list)

    class Meta:
        db_table = "alert_rules"
        ordering = ("alert_type", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "project", "alert_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_alert_rule_workspace_project_type",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "enabled"]),
        ]

    def __str__(self) -> str:
        return f"{self.alert_type} ({self.workspace_id})"


class UserAlertPreference(BaseModel):
    """Per-user alert channel preference; overrides AlertRule defaults."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alert_preferences",
    )
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="user_alert_preferences")
    alert_type = models.CharField(max_length=30)
    channel_type = models.CharField(max_length=20)
    enabled = models.BooleanField(default=True)

    class Meta:
        db_table = "user_alert_preferences"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace", "alert_type", "channel_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_user_alert_pref",
            )
        ]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.alert_type}:{self.channel_type}"


class AlertLog(BaseModel):
    """Audit log for each alert dispatch attempt."""

    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        THROTTLED = "throttled", "Throttled"
        SKIPPED = "skipped", "Skipped"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="alert_logs")
    alert_rule = models.ForeignKey(AlertRule, on_delete=models.SET_NULL, null=True, related_name="logs")
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="alert_logs")
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_alert_logs",
    )
    channel = models.CharField(max_length=20)
    alert_type = models.CharField(max_length=30)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    data = models.JSONField(default=dict)
    error = models.TextField(blank=True, default="")
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "alert_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["issue", "alert_type", "channel"]),
            models.Index(fields=["receiver", "created_at"]),
            models.Index(fields=["workspace", "alert_type", "created_at"]),
            models.Index(fields=["receiver", "issue", "alert_type", "channel"]),
        ]

    def __str__(self) -> str:
        return f"{self.alert_type}:{self.channel}:{self.status}"
