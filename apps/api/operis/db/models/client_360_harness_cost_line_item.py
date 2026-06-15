from django.db import models

from .base import BaseModel


class Client360HarnessCostLineItem(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_harness_cost_lines",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_360_harness_cost_lines",
    )
    pipeline_id = models.CharField(max_length=120)
    cost_usd = models.DecimalField(max_digits=14, decimal_places=4)
    attributed_month = models.DateField()
    attribution_tags = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "client_360_harness_cost_line_items"
        ordering = ("-attributed_month", "-created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "pipeline_id", "attributed_month"],
                condition=models.Q(deleted_at__isnull=True),
                name="client360_harness_cost_line_unique",
            )
        ]
