from django.db import models

from .base import BaseModel


class Client360CrmSyncRun(BaseModel):
    STATUS_OK = "ok"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_OK, "Ok"),
        (STATUS_FAILED, "Failed"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_crm_sync_runs",
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    customers_updated = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "client_360_crm_sync_runs"
        ordering = ("-created_at",)
