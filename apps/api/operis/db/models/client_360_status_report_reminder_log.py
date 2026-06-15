from django.db import models

from .base import BaseModel


class Client360StatusReportReminderLog(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_status_report_reminder_logs",
    )
    board = models.ForeignKey(
        "db.Board",
        on_delete=models.CASCADE,
        related_name="client_360_status_report_reminder_logs",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    notified_count = models.PositiveIntegerField(default=0)
    skipped_count = models.PositiveIntegerField(default=0)
    details = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "client_360_status_report_reminder_logs"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["board", "period_start"]),
        ]
