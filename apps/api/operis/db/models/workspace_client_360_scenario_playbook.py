from django.db import models

from .base import BaseModel


class WorkspaceClient360ScenarioPlaybook(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_scenario_playbooks",
    )
    scenario_key = models.CharField(max_length=64)
    playbook_code = models.CharField(max_length=32)
    title = models.CharField(max_length=200)
    markdown = models.TextField()
    locale = models.CharField(max_length=16, default="pt-BR")
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "client_360_scenario_playbooks"
        ordering = ("scenario_key", "playbook_code")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "scenario_key", "locale"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_scenario_playbook_uniq",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.playbook_code} ({self.scenario_key})"
