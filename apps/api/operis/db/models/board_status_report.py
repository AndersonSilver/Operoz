from django.db import models
from django.db.models import Q

from .base import BaseModel


class BoardStatusReport(BaseModel):
    board = models.ForeignKey(
        "db.Board",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.CASCADE,
        related_name="status_reports",
        null=True,
        blank=True,
    )
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_status_reports")
    title = models.CharField(max_length=255, blank=True, default="")
    period_start = models.DateField()
    period_end = models.DateField()
    content = models.JSONField(default=dict)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "board_status_reports"
        ordering = ("-period_end", "-created_at")
        indexes = [
            models.Index(fields=["board", "period_end"]),
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self):
        return self.title or f"Status report {self.period_start} — {self.period_end}"


class BoardStatusReportModule(BaseModel):
    report = models.ForeignKey(
        BoardStatusReport,
        on_delete=models.CASCADE,
        related_name="report_modules",
    )
    module = models.ForeignKey(
        "db.Module",
        on_delete=models.CASCADE,
        related_name="status_report_links",
    )
    sort_order = models.FloatField(default=0)

    class Meta:
        db_table = "board_status_report_modules"
        ordering = ("sort_order", "created_at")
        constraints = [
            models.UniqueConstraint(
                fields=["report", "module"],
                condition=Q(deleted_at__isnull=True),
                name="board_status_report_module_unique_report_module_when_deleted_at_null",
            )
        ]

    def __str__(self):
        return f"{self.report_id} — {self.module_id}"
