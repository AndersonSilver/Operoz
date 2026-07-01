from django.db import models

from .base import BaseModel

DEFAULT_PHASE_FLAGS = {
    "0": True,
    "1": True,
    "2": True,
    "3": True,
    "4": True,
    "5": True,
    "6": True,
}


class WorkspaceClient360EnterpriseSettings(BaseModel):
    GROUPING_PROJECT = "project"
    GROUPING_CUSTOMER = "customer"
    GROUPING_CHOICES = (
        (GROUPING_PROJECT, "Project"),
        (GROUPING_CUSTOMER, "Customer"),
    )

    workspace = models.OneToOneField(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_enterprise_settings",
    )
    phase_flags = models.JSONField(default=dict, blank=True)
    list_grouping_mode = models.CharField(
        max_length=16,
        choices=GROUPING_CHOICES,
        default=GROUPING_PROJECT,
    )
    crm_enabled = models.BooleanField(default=False)
    crm_provider = models.CharField(max_length=32, blank=True, default="")
    crm_config = models.JSONField(default=dict, blank=True)
    crm_push_enabled = models.BooleanField(default=False)
    crm_last_sync_at = models.DateTimeField(null=True, blank=True)
    crm_stale = models.BooleanField(default=False)
    retention_weeks = models.PositiveSmallIntegerField(default=52)
    data_region = models.CharField(max_length=8, default="EU")
    bi_export_enabled = models.BooleanField(default=True)
    guest_sso_enabled = models.BooleanField(default=False)
    guest_sso_config = models.JSONField(default=dict, blank=True)
    guest_magic_link_fallback = models.BooleanField(default=True)

    class Meta:
        db_table = "workspace_client_360_enterprise_settings"

    def __str__(self) -> str:
        return f"Client360 enterprise ws={self.workspace_id}"
