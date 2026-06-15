from django.db import models

from .base import BaseModel


class Client360ProjectFinopsProfile(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_finops_profiles",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_finops_profiles",
    )
    period_month = models.DateField(help_text="First day of the month for this snapshot.")
    hours_allocated = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    capacity_hours = models.DecimalField(max_digits=10, decimal_places=2, default=160)
    harness_cost_mtd = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    harness_cost_breakdown = models.JSONField(default=list, blank=True)
    harness_project_tag = models.CharField(max_length=120, blank=True, default="")
    harness_last_sync_at = models.DateTimeField(null=True, blank=True)
    budget_planned = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    budget_actual = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    revenue_contract = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "client_360_project_finops_profiles"
        ordering = ("-period_month", "project_id")
        constraints = [
            models.UniqueConstraint(
                fields=["project", "period_month"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_finops_profile_unique_month",
            )
        ]

    def __str__(self) -> str:
        return f"FinOps {self.project_id} {self.period_month}"
