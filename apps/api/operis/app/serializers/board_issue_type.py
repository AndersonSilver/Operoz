from rest_framework import serializers

from operis.app.serializers.base import BaseSerializer
from operis.db.models import BoardIssueType, IssueType


class BoardIssueTypeSerializer(BaseSerializer):
    issue_type_id = serializers.UUIDField(source="issue_type.id", read_only=True)
    name = serializers.CharField(source="issue_type.name", required=False)
    description = serializers.CharField(source="issue_type.description", required=False, allow_blank=True)
    logo_props = serializers.JSONField(source="issue_type.logo_props", required=False)
    is_active = serializers.BooleanField(source="issue_type.is_active", read_only=True)
    is_epic = serializers.BooleanField(source="issue_type.is_epic", read_only=True)
    is_default = serializers.BooleanField(source="issue_type.is_default", read_only=True)

    class Meta:
        model = BoardIssueType
        fields = [
            "id",
            "issue_type_id",
            "name",
            "description",
            "logo_props",
            "sort_order",
            "is_enabled",
            "is_active",
            "is_epic",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "issue_type_id", "is_active", "is_epic", "is_default", "created_at", "updated_at"]

    def validate_name(self, value):
        workspace_id = self.context.get("workspace_id")
        if not workspace_id:
            return value
        qs = IssueType.objects.filter(workspace_id=workspace_id, name=value, deleted_at__isnull=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.issue_type_id)
        if qs.exists():
            raise serializers.ValidationError("ISSUE_TYPE_NAME_ALREADY_EXISTS")
        return value

    def update(self, instance, validated_data):
        issue_type_data = validated_data.pop("issue_type", {})
        for attr, value in issue_type_data.items():
            setattr(instance.issue_type, attr, value)
        if issue_type_data:
            instance.issue_type.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class BoardIssueTypeCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    logo_props = serializers.JSONField(required=False, default=dict)
    sort_order = serializers.FloatField(required=False)
    is_enabled = serializers.BooleanField(required=False, default=True)


class ProjectIssueTypeLiteSerializer(BaseSerializer):
    class Meta:
        model = IssueType
        fields = ["id", "name", "description", "logo_props", "is_active", "is_default", "is_epic", "level"]
        read_only_fields = fields
