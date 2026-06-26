from rest_framework import serializers

from operis.db.models import AlertLog, AlertRule, UserAlertPreference, UserExternalAccount
from operis.db.models.alert import AlertRule as AlertRuleModel

from .base import BaseSerializer
from .user import UserLiteSerializer


class AlertRuleSerializer(BaseSerializer):
    class Meta:
        model = AlertRule
        fields = (
            "id",
            "alert_type",
            "name",
            "enabled",
            "workspace",
            "project",
            "config",
            "channels",
            "escalation_schedule",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "workspace", "created_at", "updated_at")

    def validate_alert_type(self, value: str) -> str:
        valid = {choice.value for choice in AlertRuleModel.AlertType}
        if value not in valid:
            raise serializers.ValidationError("Invalid alert_type")
        return value


class UserAlertPreferenceItemSerializer(serializers.Serializer):
    alert_type = serializers.CharField(max_length=30)
    channel_type = serializers.CharField(max_length=20)
    enabled = serializers.BooleanField()


class UserAlertPreferencesSerializer(serializers.Serializer):
    preferences = UserAlertPreferenceItemSerializer(many=True, required=False)
    channels = serializers.JSONField(required=False)
    quiet_hours_start = serializers.TimeField(required=False, allow_null=True)
    quiet_hours_end = serializers.TimeField(required=False, allow_null=True)
    quiet_hours_timezone = serializers.CharField(max_length=50, required=False)


class UserExternalAccountSerializer(BaseSerializer):
    class Meta:
        model = UserExternalAccount
        fields = (
            "id",
            "provider",
            "external_id",
            "is_active",
            "last_synced_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_active", "last_synced_at", "created_at", "updated_at")


class UserExternalAccountWriteSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=UserExternalAccount.Provider.choices)
    external_id = serializers.CharField(max_length=255)


class AlertLogIssueSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    sequence_id = serializers.IntegerField()
    name = serializers.CharField()
    identifier = serializers.CharField()


class AlertLogSerializer(BaseSerializer):
    issue = serializers.SerializerMethodField()
    receiver = UserLiteSerializer(read_only=True)

    class Meta:
        model = AlertLog
        fields = (
            "id",
            "alert_type",
            "channel",
            "status",
            "issue",
            "receiver",
            "sent_at",
            "error",
            "created_at",
        )

    def get_issue(self, obj: AlertLog) -> dict:
        issue = obj.issue
        identifier = ""
        if issue.project_id and hasattr(issue, "project") and issue.project:
            identifier = f"{issue.project.identifier}-{issue.sequence_id}"
        return {
            "id": str(issue.id),
            "sequence_id": issue.sequence_id,
            "name": issue.name,
            "identifier": identifier,
        }
