from django.db import models

from .base import BaseModel


class Client360SuggestedActionDismissal(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_action_dismissals",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_action_dismissals",
    )
    member = models.ForeignKey(
        "db.User",
        on_delete=models.CASCADE,
        related_name="client_360_action_dismissals",
    )
    action_key = models.CharField(max_length=64)

    class Meta:
        db_table = "client_360_suggested_action_dismissals"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "member", "action_key"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_action_dismiss_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"ActionDismiss {self.action_key} project={self.project_id}"
