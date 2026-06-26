from rest_framework import status
from rest_framework.response import Response

from operis.alerts.preferences import ALL_CHANNEL_TYPES
from operis.app.permissions import ROLE, allow_permission
from operis.app.serializers.alert import UserAlertPreferencesSerializer
from operis.app.views.base import BaseAPIView
from operis.db.models import AlertRule, UserAlertPreference, UserNotificationPreference, Workspace
from operis.db.models.notification import default_alert_channels


class UserAlertPreferenceView(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        stored = {
            (row.alert_type, row.channel_type): row.enabled
            for row in UserAlertPreference.objects.filter(
                user=request.user,
                workspace=workspace,
                deleted_at__isnull=True,
            )
        }
        alert_types = [choice.value for choice in AlertRule.AlertType]
        preferences = []
        for alert_type in alert_types:
            for channel_type in ALL_CHANNEL_TYPES:
                preferences.append(
                    {
                        "alert_type": alert_type,
                        "channel_type": channel_type,
                        "enabled": stored.get((alert_type, channel_type), channel_type in ("email", "in_app")),
                    }
                )

        notification_pref = UserNotificationPreference.objects.filter(
            user=request.user,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()

        payload = {
            "preferences": preferences,
            "channels": notification_pref.channels if notification_pref else default_alert_channels(),
            "quiet_hours_start": notification_pref.quiet_hours_start if notification_pref else None,
            "quiet_hours_end": notification_pref.quiet_hours_end if notification_pref else None,
            "quiet_hours_timezone": notification_pref.quiet_hours_timezone if notification_pref else "UTC",
        }
        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = UserAlertPreferencesSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        for item in data.get("preferences", []):
            pref, _ = UserAlertPreference.objects.get_or_create(
                user=request.user,
                workspace=workspace,
                alert_type=item["alert_type"],
                channel_type=item["channel_type"],
                defaults={"enabled": item["enabled"]},
            )
            pref.enabled = item["enabled"]
            pref.save(update_fields=["enabled", "updated_at"])

        quiet_fields = {}
        if "quiet_hours_start" in data:
            quiet_fields["quiet_hours_start"] = data["quiet_hours_start"]
        if "quiet_hours_end" in data:
            quiet_fields["quiet_hours_end"] = data["quiet_hours_end"]
        if "quiet_hours_timezone" in data:
            quiet_fields["quiet_hours_timezone"] = data["quiet_hours_timezone"]

        channels_payload = data.get("channels")
        if quiet_fields or channels_payload is not None:
            notification_pref, _ = UserNotificationPreference.objects.get_or_create(
                user=request.user,
                workspace=workspace,
                defaults={"channels": default_alert_channels()},
            )
            for key, value in quiet_fields.items():
                setattr(notification_pref, key, value)
            if channels_payload is not None:
                merged = {**(notification_pref.channels or {}), **channels_payload}
                notification_pref.channels = merged
            notification_pref.save()

        return self.get(request, slug=slug)
