# Third Party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .project import ProjectLiteSerializer

# Django imports
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

from django.template.defaultfilters import slugify

from operoz.db.models import (
    User,
    Module,
    ModuleMember,
    ModuleIssue,
    ModuleLink,
    ModuleUserProperties,
    BoardIssueType,
)
from operoz.db.models.module import ModuleGanttBarColorMode
from operoz.utils.board_issue_types import board_issue_type_stage_color


def serialize_module_stage_detail(board_issue_type: BoardIssueType | None) -> dict | None:
    """Etapa do módulo = tipo de card habilitado no board (fonte única)."""
    if board_issue_type is None:
        return None
    issue_type = board_issue_type.issue_type
    return {
        "id": str(board_issue_type.id),
        "name": issue_type.name,
        "slug": slugify(issue_type.name)[:60] or "stage",
        "color": board_issue_type_stage_color(board_issue_type) or "#00b8a9",
        "sort_order": board_issue_type.sort_order,
        "is_default": bool(issue_type.is_default),
        "is_active": bool(board_issue_type.is_enabled and issue_type.is_active),
    }


class ModuleWriteSerializer(BaseSerializer):
    lead_id = serializers.PrimaryKeyRelatedField(
        source="lead", queryset=User.objects.all(), required=False, allow_null=True
    )
    member_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
    )
    stage_id = serializers.PrimaryKeyRelatedField(
        source="stage",
        queryset=BoardIssueType.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "archived_at",
            "deleted_at",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["member_ids"] = [str(member.id) for member in instance.members.all()]
        return data

    def validate(self, data):
        mode = data.get("gantt_bar_color_mode")
        if mode is None and self.instance is not None:
            mode = self.instance.gantt_bar_color_mode
        custom_color = data.get("gantt_bar_custom_color")
        if mode == ModuleGanttBarColorMode.CUSTOM:
            color = custom_color if custom_color is not None else getattr(self.instance, "gantt_bar_custom_color", "")
            if not color or not color.startswith("#") or len(color) != 7:
                raise serializers.ValidationError(
                    {"gantt_bar_custom_color": "A valid hex color is required when using custom gantt bar color."}
                )

        if data.get("member_ids") is None:
            data["member_ids"] = []
        if (
            data.get("start_date", None) is not None
            and data.get("target_date", None) is not None
            and data.get("start_date", None) > data.get("target_date", None)
        ):
            raise serializers.ValidationError("Start date cannot exceed target date")

        stage = data.get("stage")
        project = self.context.get("project") or (self.instance.project if self.instance else None)
        if stage is not None and project is not None:
            if stage.board_id != project.board_id or stage.deleted_at is not None:
                raise serializers.ValidationError({"stage_id": "Stage must belong to the project board."})
            if not stage.is_enabled or not stage.issue_type.is_active or stage.issue_type.deleted_at is not None:
                raise serializers.ValidationError({"stage_id": "Stage is not active."})

        return data

    def create(self, validated_data):
        members = validated_data.pop("member_ids", None)
        project = self.context["project"]

        module_name = validated_data.get("name")
        if module_name:
            # Lookup for the module name in the module table for that project
            if Module.objects.filter(name=module_name, project=project).exists():
                raise serializers.ValidationError({"error": "Module with this name already exists"})

        module = Module.objects.create(**validated_data, project=project)
        if members is not None:
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=module,
                        member=member,
                        project=project,
                        workspace=project.workspace,
                        created_by=module.created_by,
                        updated_by=module.updated_by,
                    )
                    for member in members
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        return module

    def update(self, instance, validated_data):
        members = validated_data.pop("member_ids", None)
        module_name = validated_data.get("name")
        if module_name:
            # Lookup for the module name in the module table for that project
            if Module.objects.filter(name=module_name, project=instance.project).exclude(id=instance.id).exists():
                raise serializers.ValidationError({"error": "Module with this name already exists"})

        if members is not None:
            ModuleMember.objects.filter(module=instance).delete()
            ModuleMember.objects.bulk_create(
                [
                    ModuleMember(
                        module=instance,
                        member=member,
                        project=instance.project,
                        workspace=instance.project.workspace,
                        created_by=instance.created_by,
                        updated_by=instance.updated_by,
                    )
                    for member in members
                ],
                batch_size=10,
                ignore_conflicts=True,
            )

        return super().update(instance, validated_data)


class ModuleFlatSerializer(BaseSerializer):
    class Meta:
        model = Module
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class ModuleIssueSerializer(BaseSerializer):
    module_detail = ModuleFlatSerializer(read_only=True, source="module")
    issue_detail = ProjectLiteSerializer(read_only=True, source="issue")
    sub_issues_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ModuleIssue
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "module",
        ]


class ModuleLinkSerializer(BaseSerializer):
    class Meta:
        model = ModuleLink
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "module",
        ]

    def to_internal_value(self, data):
        # Modify the URL before validation by appending http:// if missing
        url = data.get("url", "")
        if url and not url.startswith(("http://", "https://")):
            data["url"] = "http://" + url

        return super().to_internal_value(data)

    def validate_url(self, value):
        # Use Django's built-in URLValidator for validation
        url_validator = URLValidator()
        try:
            url_validator(value)
        except ValidationError:
            raise serializers.ValidationError({"error": "Invalid URL format."})

        return value

    def create(self, validated_data):
        validated_data["url"] = self.validate_url(validated_data.get("url"))
        if ModuleLink.objects.filter(url=validated_data.get("url"), module_id=validated_data.get("module_id")).exists():
            raise serializers.ValidationError({"error": "URL already exists."})
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["url"] = self.validate_url(validated_data.get("url"))
        if (
            ModuleLink.objects.filter(url=validated_data.get("url"), module_id=instance.module_id)
            .exclude(pk=instance.id)
            .exists()
        ):
            raise serializers.ValidationError({"error": "URL already exists for this Issue"})

        return super().update(instance, validated_data)


class ModuleSerializer(DynamicBaseSerializer):
    member_ids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_null=True)
    stage_id = serializers.SerializerMethodField()
    stage_detail = serializers.SerializerMethodField()
    is_favorite = serializers.BooleanField(read_only=True)
    total_issues = serializers.IntegerField(read_only=True)
    cancelled_issues = serializers.IntegerField(read_only=True)
    completed_issues = serializers.IntegerField(read_only=True)
    started_issues = serializers.IntegerField(read_only=True)
    unstarted_issues = serializers.IntegerField(read_only=True)
    backlog_issues = serializers.IntegerField(read_only=True)
    total_estimate_points = serializers.FloatField(read_only=True)
    completed_estimate_points = serializers.FloatField(read_only=True)

    class Meta:
        model = Module
        fields = [
            # Required fields
            "id",
            "workspace_id",
            "project_id",
            # Model fields
            "name",
            "description",
            "description_text",
            "description_html",
            "start_date",
            "target_date",
            "status",
            "lead_id",
            "member_ids",
            "stage_id",
            "stage_detail",
            "view_props",
            "sort_order",
            "external_source",
            "external_id",
            "logo_props",
            "gantt_bar_color_mode",
            "gantt_bar_custom_color",
            # computed fields
            "total_estimate_points",
            "completed_estimate_points",
            "is_favorite",
            "total_issues",
            "cancelled_issues",
            "completed_issues",
            "started_issues",
            "unstarted_issues",
            "backlog_issues",
            "created_at",
            "updated_at",
            "archived_at",
        ]
        read_only_fields = fields

    def get_stage_id(self, obj):
        return str(obj.stage_id) if obj.stage_id else None

    def get_stage_detail(self, obj):
        return serialize_module_stage_detail(obj.stage)


class ModuleDetailSerializer(ModuleSerializer):
    link_module = ModuleLinkSerializer(read_only=True, many=True)
    sub_issues = serializers.IntegerField(read_only=True)
    backlog_estimate_points = serializers.FloatField(read_only=True)
    unstarted_estimate_points = serializers.FloatField(read_only=True)
    started_estimate_points = serializers.FloatField(read_only=True)
    cancelled_estimate_points = serializers.FloatField(read_only=True)

    class Meta(ModuleSerializer.Meta):
        fields = ModuleSerializer.Meta.fields + [
            "link_module",
            "sub_issues",
            "backlog_estimate_points",
            "unstarted_estimate_points",
            "started_estimate_points",
            "cancelled_estimate_points",
        ]


class ModuleUserPropertiesSerializer(BaseSerializer):
    class Meta:
        model = ModuleUserProperties
        fields = "__all__"
        read_only_fields = ["workspace", "project", "module", "user"]
