from django.db import models

from .base import BaseModel


class Client360WorkspaceSharedView(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_shared_views",
    )
    name = models.CharField(max_length=48)
    payload = models.JSONField(default=dict)
    is_shared = models.BooleanField(default=True)

    class Meta:
        db_table = "client_360_workspace_shared_views"
        ordering = ("name",)

    def __str__(self) -> str:
        return f"{self.name} ({self.workspace_id})"
