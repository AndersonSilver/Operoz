from django.db import models

from .base import BaseModel


class WorkspaceClient360Settings(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_settings",
    )
    health_score_display_enabled = models.BooleanField(
        default=False,
        help_text="When enabled, Visão 360 UI shows numeric health score alongside RAG semáforo.",
    )

    class Meta:
        db_table = "workspace_client_360_settings"

    def __str__(self) -> str:
        return f"Client360 settings workspace={self.workspace_id}"
