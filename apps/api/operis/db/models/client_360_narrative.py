from django.db import models

from .base import BaseModel


class Client360Narrative(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_narratives",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_narratives",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    wins_md = models.TextField(blank=True, default="")
    risks_md = models.TextField(blank=True, default="")
    next_steps_md = models.TextField(blank=True, default="")

    class Meta:
        db_table = "client_360_narratives"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "period_start"],
                name="client360_narrative_project_week_uniq",
            ),
        ]
