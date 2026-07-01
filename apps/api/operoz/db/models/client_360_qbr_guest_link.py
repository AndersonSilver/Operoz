import secrets

from django.db import models

from .base import BaseModel


def generate_qbr_guest_token() -> str:
    return f"operoz_qbr_{secrets.token_urlsafe(32)}"


class Client360QbrGuestLink(BaseModel):
    SCOPE_PORTFOLIO = "portfolio"
    SCOPE_CLIENT = "client"
    SCOPE_CHOICES = (
        (SCOPE_PORTFOLIO, "Portfolio"),
        (SCOPE_CLIENT, "Client"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="client_360_qbr_guest_links",
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="client_360_qbr_guest_links",
        null=True,
        blank=True,
    )
    scope = models.CharField(max_length=16, choices=SCOPE_CHOICES)
    token = models.CharField(max_length=128, unique=True, default=generate_qbr_guest_token, db_index=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    period_start = models.DateField()
    period_end = models.DateField()
    weeks = models.PositiveSmallIntegerField(default=13)
    include_compare = models.BooleanField(default=False)
    portfolio_project_ids = models.JSONField(default=list, blank=True)
    access_count = models.PositiveIntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "client_360_qbr_guest_links"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["workspace", "scope"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self) -> str:
        return f"QbrGuestLink {self.scope} ws={self.workspace_id}"


class Client360QbrGuestAccessLog(BaseModel):
    link = models.ForeignKey(
        Client360QbrGuestLink,
        on_delete=models.CASCADE,
        related_name="access_logs",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True, default="")

    class Meta:
        db_table = "client_360_qbr_guest_access_logs"
        ordering = ("-created_at",)
