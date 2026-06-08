from rest_framework import serializers

from operis.db.models import EmailNotificationLog, Notification, UserNotificationPreference

from .base import BaseSerializer
from .user import UserLiteSerializer


class NotificationSerializer(BaseSerializer):
    triggered_by_details = UserLiteSerializer(read_only=True, source="triggered_by")
    is_inbox_issue = serializers.BooleanField(read_only=True)
    is_intake_issue = serializers.BooleanField(read_only=True)
    is_mentioned_notification = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"


class UserNotificationPreferenceSerializer(BaseSerializer):
    class Meta:
        model = UserNotificationPreference
        fields = "__all__"


class EmailNotificationLogSerializer(serializers.ModelSerializer):
    receiver_email = serializers.EmailField(source="receiver.email", read_only=True)
    receiver_name = serializers.CharField(source="receiver.display_name", read_only=True)
    triggered_by_email = serializers.EmailField(source="triggered_by.email", read_only=True)
    triggered_by_name = serializers.CharField(source="triggered_by.display_name", read_only=True)

    class Meta:
        model = EmailNotificationLog
        fields = (
            "id",
            "receiver_email",
            "receiver_name",
            "triggered_by_email",
            "triggered_by_name",
            "entity",
            "entity_name",
            "entity_identifier",
            "old_value",
            "new_value",
            "processed_at",
            "sent_at",
            "created_at",
        )
