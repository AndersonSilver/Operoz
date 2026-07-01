from django.db import models

from .base import BaseModel


class BoardClient360HealthSettings(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="board_client_360_health_settings",
    )
    board = models.OneToOneField(
        "db.Board",
        on_delete=models.CASCADE,
        related_name="client_360_health_settings",
    )
    weight_report = models.PositiveSmallIntegerField(default=60)
    weight_overdue = models.PositiveSmallIntegerField(default=25)
    weight_support = models.PositiveSmallIntegerField(default=15)
    threshold_ok_min = models.PositiveSmallIntegerField(default=70)
    threshold_warning_min = models.PositiveSmallIntegerField(default=45)
    score_alert_threshold = models.PositiveSmallIntegerField(default=40)
    status_report_reminder_enabled = models.BooleanField(default=False)
    status_report_reminder_email = models.BooleanField(default=False)
    support_sla_days = models.PositiveSmallIntegerField(default=7)

    class Meta:
        db_table = "board_client_360_health_settings"

    def __str__(self) -> str:
        return f"Client360 health settings board={self.board_id}"
