# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.db.models import (
    BoardCustomField,
    BoardProjectFieldLayout,
    BoardProjectFieldSource,
    BoardStandardField,
    CustomFieldType,
    IssueCustomFieldValue,
    ProjectCustomFieldValue,
    WorkspaceCustomField,
)
from plane.utils.board_custom_fields import slugify_field_key, unique_field_key


class WorkspaceCustomFieldSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceCustomField
        fields = [
            "id",
            "name",
            "key",
            "description",
            "field_type",
            "settings",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "key", "created_at", "updated_at"]

    def validate_field_type(self, value):
        if value not in CustomFieldType.values:
            raise serializers.ValidationError("INVALID_FIELD_TYPE")
        return value

    def validate_settings(self, value):
        field_type = self.initial_data.get("field_type") or getattr(self.instance, "field_type", None)
        if field_type in CustomFieldType.option_field_types():
            options = (value or {}).get("options")
            if not options or not isinstance(options, list) or len(options) == 0:
                raise serializers.ValidationError("SELECT_REQUIRES_OPTIONS")
        return value or {}

    def create(self, validated_data):
        workspace_id = self.context["workspace_id"]
        base_key = slugify_field_key(validated_data["name"])
        validated_data["key"] = unique_field_key(workspace_id, base_key)
        validated_data["workspace_id"] = workspace_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "name" in validated_data and validated_data["name"] != instance.name:
            base_key = slugify_field_key(validated_data["name"])
            validated_data["key"] = unique_field_key(instance.workspace_id, base_key)
        return super().update(instance, validated_data)


class BoardStandardFieldSerializer(BaseSerializer):
    standard_field_key = serializers.CharField(source="field_key", read_only=True)
    name = serializers.SerializerMethodField()
    key = serializers.CharField(source="field_key", read_only=True)
    description = serializers.SerializerMethodField()
    field_type = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    is_system = serializers.SerializerMethodField()
    custom_field_id = serializers.SerializerMethodField()

    class Meta:
        model = BoardStandardField
        fields = [
            "id",
            "custom_field_id",
            "standard_field_key",
            "name",
            "key",
            "description",
            "field_type",
            "settings",
            "sort_order",
            "is_enabled",
            "form_span",
            "is_active",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_name(self, obj):
        return obj.field_key

    def get_description(self, obj):
        return ""

    def get_field_type(self, obj):
        return "standard"

    def get_settings(self, obj):
        return {}

    def get_is_active(self, obj):
        return True

    def get_is_system(self, obj):
        return True

    def get_custom_field_id(self, obj):
        return None


class BoardStandardFieldUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardStandardField
        fields = ["is_enabled", "sort_order", "form_span"]


class BoardCustomFieldSerializer(BaseSerializer):
    is_system = serializers.SerializerMethodField()
    standard_field_key = serializers.SerializerMethodField()

    def get_is_system(self, obj):
        return False

    def get_standard_field_key(self, obj):
        return None

    custom_field_id = serializers.UUIDField(source="custom_field.id", read_only=True)
    name = serializers.CharField(source="custom_field.name", read_only=True)
    key = serializers.CharField(source="custom_field.key", read_only=True)
    description = serializers.CharField(source="custom_field.description", read_only=True)
    field_type = serializers.CharField(source="custom_field.field_type", read_only=True)
    settings = serializers.JSONField(source="custom_field.settings", read_only=True)
    is_active = serializers.BooleanField(source="custom_field.is_active", read_only=True)

    class Meta:
        model = BoardCustomField
        fields = [
            "id",
            "custom_field_id",
            "standard_field_key",
            "name",
            "key",
            "description",
            "field_type",
            "settings",
            "sort_order",
            "is_enabled",
            "form_span",
            "is_active",
            "is_system",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "custom_field_id",
            "standard_field_key",
            "name",
            "key",
            "description",
            "field_type",
            "settings",
            "is_active",
            "is_system",
            "created_at",
            "updated_at",
        ]


class BoardCustomFieldCreateSerializer(serializers.Serializer):
    custom_field_id = serializers.UUIDField(required=False)
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    field_type = serializers.ChoiceField(choices=CustomFieldType.choices, required=False)
    settings = serializers.JSONField(required=False, default=dict)
    sort_order = serializers.FloatField(required=False)
    is_enabled = serializers.BooleanField(required=False, default=True)


class BoardCustomFieldBulkAddSerializer(serializers.Serializer):
    custom_field_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


class ProjectCustomFieldSerializer(BaseSerializer):
    class Meta:
        model = WorkspaceCustomField
        fields = ["id", "name", "key", "description", "field_type", "settings"]
        read_only_fields = fields


class IssueCustomFieldValueSerializer(BaseSerializer):
    custom_field_id = serializers.UUIDField(source="custom_field.id", read_only=True)
    name = serializers.CharField(source="custom_field.name", read_only=True)
    field_type = serializers.CharField(source="custom_field.field_type", read_only=True)
    settings = serializers.JSONField(source="custom_field.settings", read_only=True)

    class Meta:
        model = IssueCustomFieldValue
        fields = [
            "id",
            "custom_field_id",
            "name",
            "field_type",
            "settings",
            "value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "custom_field_id", "name", "field_type", "settings", "created_at", "updated_at"]


class IssueCustomFieldValueWriteSerializer(serializers.Serializer):
    custom_field_id = serializers.UUIDField()
    value = serializers.JSONField(allow_null=True)


class IssueCustomFieldValuesBulkSerializer(serializers.Serializer):
    values = IssueCustomFieldValueWriteSerializer(many=True)


class BoardProjectFieldLayoutSerializer(BaseSerializer):
    name = serializers.SerializerMethodField()
    field_type = serializers.SerializerMethodField()
    custom_field_id = serializers.SerializerMethodField()
    standard_field_key = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = BoardProjectFieldLayout
        fields = [
            "id",
            "field_source",
            "standard_field_key",
            "custom_field_id",
            "name",
            "field_type",
            "section",
            "sort_order",
            "is_required",
            "is_enabled",
            "form_span",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_name(self, obj):
        if obj.field_source == BoardProjectFieldSource.CUSTOM and obj.custom_field_id:
            return obj.custom_field.name
        return obj.standard_field_key or ""

    def get_field_type(self, obj):
        if obj.field_source == BoardProjectFieldSource.CUSTOM and obj.custom_field_id:
            return obj.custom_field.field_type
        return "standard"

    def get_custom_field_id(self, obj):
        if obj.custom_field_id:
            return str(obj.custom_field_id)
        return None


class BoardProjectFieldLayoutUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardProjectFieldLayout
        fields = ["section", "sort_order", "is_required", "is_enabled", "form_span"]


class BoardProjectFieldLayoutAddCustomSerializer(serializers.Serializer):
    custom_field_id = serializers.UUIDField()
    section = serializers.ChoiceField(choices=["description", "context"], default="description")
    sort_order = serializers.FloatField(required=False)
    is_required = serializers.BooleanField(required=False, default=False)
    form_span = serializers.ChoiceField(choices=["half", "full"], required=False, default="half")


class ProjectCustomFieldValueSerializer(BaseSerializer):
    custom_field_id = serializers.UUIDField(source="custom_field.id", read_only=True)
    name = serializers.CharField(source="custom_field.name", read_only=True)
    field_type = serializers.CharField(source="custom_field.field_type", read_only=True)
    settings = serializers.JSONField(source="custom_field.settings", read_only=True)

    class Meta:
        model = ProjectCustomFieldValue
        fields = [
            "id",
            "custom_field_id",
            "name",
            "field_type",
            "settings",
            "value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "custom_field_id", "name", "field_type", "settings", "created_at", "updated_at"]


class ProjectCustomFieldValueWriteSerializer(serializers.Serializer):
    custom_field_id = serializers.UUIDField()
    value = serializers.JSONField(allow_null=True)


class ProjectCustomFieldValuesBulkSerializer(serializers.Serializer):
    values = ProjectCustomFieldValueWriteSerializer(many=True)
