from django.conf import settings
from django.db import models

from .base import BaseModel


class Client360ConsultantAllocation(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_consultant_allocations",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_consultant_allocations",
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_360_consultant_allocations",
    )
    period_month = models.DateField()
    hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = "client_360_consultant_allocations"
        ordering = ("-period_month", "project_id", "member_id")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "member", "period_month"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_consultant_alloc_unique_month",
            )
        ]
