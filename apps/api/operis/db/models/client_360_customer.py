from django.db import models

from .base import BaseModel


class Client360Customer(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_customers",
    )
    name = models.CharField(max_length=255)
    external_crm_id = models.CharField(max_length=128, blank=True, default="", db_index=True)
    segment = models.CharField(max_length=64, blank=True, default="")
    account_owner = models.CharField(max_length=255, blank=True, default="")
    revenue_contract = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    logo_props = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "client_360_customers"
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "external_crm_id"],
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(external_crm_id=""),
                name="client360_customer_crm_id_uniq",
            ),
        ]

    def __str__(self) -> str:
        return self.name
