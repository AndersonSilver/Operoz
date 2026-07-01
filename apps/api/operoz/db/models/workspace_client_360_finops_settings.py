from django.db import models

from .base import BaseModel


class WorkspaceClient360FinopsSettings(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_finops_settings",
    )
    variance_alert_pct = models.PositiveSmallIntegerField(default=10)
    margin_alert_pct = models.PositiveSmallIntegerField(default=15)
    squad_weekly_capacity_hours = models.PositiveSmallIntegerField(default=40)

    class Meta:
        db_table = "workspace_client_360_finops_settings"

    def __str__(self) -> str:
        return f"FinOps settings {self.workspace_id}"
