from rest_framework import serializers

from operoz.db.models import Workspace


class WorkspaceIntegrationFlagsSerializer(serializers.ModelSerializer):
    """Writable subset for God Mode — per-workspace external integration toggles."""

    class Meta:
        model = Workspace
        fields = (
            "is_google_calendar_enabled",
            "is_discord_dm_enabled",
        )
