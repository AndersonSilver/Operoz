from django.db import models

from operoz.utils.support_criticality import DEFAULT_SLA_MINUTES

from .base import BaseModel


def default_support_sla_policies() -> dict:
    return {key: {"duration_minutes": minutes} for key, minutes in DEFAULT_SLA_MINUTES.items()}


class BoardSupportSlaPolicy(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="board_support_sla_policies")
    board = models.OneToOneField("db.Board", on_delete=models.CASCADE, related_name="support_sla_policy")
    policies = models.JSONField(default=default_support_sla_policies)
    # Prazo em dias do aging da fila de suporte. Vivia em
    # BoardClient360HealthSettings; migrou para ca com a remocao do Cliente 360,
    # que era uma dependencia invertida (Suporte lendo model de outro dominio).
    support_sla_days = models.PositiveSmallIntegerField(default=7)

    class Meta:
        verbose_name = "BoardSupportSlaPolicy"
        verbose_name_plural = "BoardSupportSlaPolicies"
        db_table = "board_support_sla_policies"
        indexes = [
            models.Index(fields=["workspace", "board"]),
        ]

    def __str__(self) -> str:
        return f"SLA policy <board={self.board_id}>"
