from django.conf import settings
from django.db import models

from operis.license.utils.encryption import decrypt_data, encrypt_data

from .base import BaseModel


class UserExternalAccount(BaseModel):
    """Maps Operis user to external notification account (Discord, Google Calendar)."""

    class Provider(models.TextChoices):
        DISCORD = "discord", "Discord"
        GOOGLE_CALENDAR = "google_calendar", "Google Calendar"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="external_accounts",
    )
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="external_accounts")
    provider = models.CharField(max_length=30, choices=Provider.choices)
    external_id = models.CharField(max_length=255)
    token_data = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_external_accounts"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["user", "workspace", "provider"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_user_external_account",
            )
        ]

    def set_token_data(self, raw: dict | None) -> None:
        if not raw:
            self.token_data = None
            return
        encrypted = {key: encrypt_data(str(value)) if value is not None else None for key, value in raw.items()}
        self.token_data = encrypted

    def get_token_data(self) -> dict:
        if not self.token_data:
            return {}
        return {key: decrypt_data(value) if value else "" for key, value in self.token_data.items()}

    def __str__(self) -> str:
        return f"{self.provider}:{self.external_id}"


class GoogleCalendarEvent(BaseModel):
    """Tracks Google Calendar events synced from Operis issues."""

    class SyncStatus(models.TextChoices):
        SYNCED = "synced", "Synced"
        ERROR = "error", "Error"
        DELETED = "deleted", "Deleted"

    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="calendar_events")
    user_external_account = models.ForeignKey(
        UserExternalAccount,
        on_delete=models.CASCADE,
        related_name="calendar_events",
    )
    google_event_id = models.CharField(max_length=255)
    calendar_id = models.CharField(max_length=255, default="primary")
    last_synced_at = models.DateTimeField(auto_now=True)
    sync_status = models.CharField(max_length=20, choices=SyncStatus.choices, default=SyncStatus.SYNCED)

    class Meta:
        db_table = "google_calendar_events"
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "user_external_account"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_gcal_event_issue_account",
            )
        ]

    def __str__(self) -> str:
        return f"{self.google_event_id} ({self.issue_id})"
