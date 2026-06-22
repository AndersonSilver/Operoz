from django.db import models

from operis.utils.support_criticality import DEFAULT_SLA_MINUTES

from .base import BaseModel


def default_support_sla_policies() -> dict:
    return {key: {"duration_minutes": minutes} for key, minutes in DEFAULT_SLA_MINUTES.items()}


class BoardSupportSlaPolicy(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_support_sla_policies")
    board = models.OneToOneField("db.Board", on_delete=models.CASCADE, related_name="support_sla_policy")
    policies = models.JSONField(default=default_support_sla_policies)

    class Meta:
        verbose_name = "BoardSupportSlaPolicy"
        verbose_name_plural = "BoardSupportSlaPolicies"
        db_table = "board_support_sla_policies"
        indexes = [
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self) -> str:
        return f"SLA policy <board={self.board_id}>"
