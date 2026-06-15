from django.db import models

from .base import BaseModel


class Client360HealthSnapshot(BaseModel):
    HEALTH_OK = "ok"
    HEALTH_WARNING = "warning"
    HEALTH_CRITICAL = "critical"
    HEALTH_CHOICES = (
        (HEALTH_OK, "Ok"),
        (HEALTH_WARNING, "Warning"),
        (HEALTH_CRITICAL, "Critical"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_health_snapshots",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_health_snapshots",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    health_score = models.PositiveSmallIntegerField()
    health = models.CharField(max_length=16, choices=HEALTH_CHOICES)

    class Meta:
        db_table = "client_360_health_snapshots"
        ordering = ("period_start",)
        constraints = [
            models.UniqueConstraint(
                fields=["project", "period_start"],
                name="client360_health_snapshot_project_week_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "period_start"]),
            models.Index(fields=["workspace", "period_start"]),
        ]

    def __str__(self) -> str:
        return f"HealthSnapshot project={self.project_id} week={self.period_start}"
