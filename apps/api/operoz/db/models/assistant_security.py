from django.conf import settings
from django.db import models

from .base import BaseModel


class AssistantActionAudit(BaseModel):
    STATUS_OK = "ok"
    STATUS_DENIED = "denied"
    STATUS_PROPOSED = "proposed"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_OK, "Ok"),
        (STATUS_DENIED, "Denied"),
        (STATUS_PROPOSED, "Proposed"),
        (STATUS_FAILED, "Failed"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assistant_action_audits",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_action_audits",
    )
    session = models.ForeignKey(
        "db.AssistantSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="action_audits",
    )
    tool_name = models.CharField(max_length=128, blank=True, default="")
    action_type = models.CharField(max_length=64, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_OK)
    payload = models.JSONField(default=dict, blank=True)
    error_code = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "assistant_action_audits"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "-created_at"], name="asst_audit_ws_idx"),
            models.Index(fields=["user", "-created_at"], name="asst_audit_user_idx"),
        ]


class AssistantUsageDaily(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="assistant_usage_daily",
    )
    usage_date = models.DateField()
    prompt_tokens = models.PositiveBigIntegerField(default=0)
    completion_tokens = models.PositiveBigIntegerField(default=0)
    request_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "assistant_usage_daily"
        ordering = ("-usage_date",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "usage_date"],
                name="assistant_usage_ws_date_unique",
            ),
        ]
