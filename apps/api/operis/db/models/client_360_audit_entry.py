from django.conf import settings
from django.db import models

from .base import BaseModel


class Client360AuditEntry(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_audit_entries",
    )
    entity_type = models.CharField(max_length=64)
    entity_id = models.CharField(max_length=64, blank=True, default="")
    action = models.CharField(max_length=64)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="client_360_audit_entries",
    )
    snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "client_360_audit_entries"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "entity_type", "-created_at"]),
        ]
