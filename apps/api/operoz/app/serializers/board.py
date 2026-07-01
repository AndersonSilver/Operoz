from django.utils.text import slugify
from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.app.serializers.user import UserLiteSerializer
from operoz.db.models import Board, Module, Workspace, WorkspaceMember
from operoz.db.models.workspace import slug_validator
from operoz.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class BoardLiteSerializer(BaseSerializer):
    class Meta:
        model = Board
        fields = ["id", "name", "slug", "identifier", "logo_props", "archived_at"]
        read_only_fields = fields


class BoardSerializer(BaseSerializer):
    class Meta:
        model = Board
        fields = [
            "id",
            "name",
            "slug",
            "identifier",
            "category",
            "space_type",
            "gantt_project_logo_props",
            "gantt_module_logo_props",
            "description",
            "logo_props",
            "sort_order",
            "archived_at",
            "workspace",
            "board_lead",
            "default_assignee",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["workspace", "archived_at", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["board_lead"] = (
            UserLiteSerializer(instance.board_lead).data if instance.board_lead_id else None
        )
        data["default_assignee"] = (
            UserLiteSerializer(instance.default_assignee).data if instance.default_assignee_id else None
        )
        return data

    def validate_slug(self, value):
        slug_validator(value)
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        return value

    def _validate_workspace_member(self, user, field_name):
        if user is None:
            return
        workspace_slug = self.context.get("workspace_slug")
        if not workspace_slug:
            return
        workspace = Workspace.objects.filter(slug=workspace_slug).first()
        if not workspace:
            return
        if not WorkspaceMember.objects.filter(
            workspace_id=workspace.id, member_id=user.id, is_active=True, deleted_at__isnull=True
        ).exists():
            raise serializers.ValidationError({field_name: "Invalid workspace member"})

    def validate(self, attrs):
        name = attrs.get("name") or (self.instance.name if self.instance else None)
        slug = attrs.get("slug")

        if not slug and name:
            attrs["slug"] = slugify(name).strip("-")[:48]

        if attrs.get("slug"):
            self.validate_slug(attrs["slug"])

        identifier = attrs.get("identifier")
        if identifier is not None:
            attrs["identifier"] = str(identifier).strip().upper()[:12]
        elif not self.instance and name and not attrs.get("identifier"):
            base = slugify(attrs.get("slug") or name).replace("-", "").upper()
            attrs["identifier"] = base[:12] if base else ""

        for field_name in ("board_lead", "default_assignee"):
            if field_name in attrs:
                self._validate_workspace_member(attrs[field_name], field_name)

        return attrs


class BoardModuleListSerializer(BaseSerializer):
    """Módulos agregados do board para o cronograma (M2-11)."""

    class Meta:
        model = Module
        fields = [
            "id",
            "workspace_id",
            "project_id",
            "name",
            "start_date",
            "target_date",
            "status",
            "sort_order",
            "archived_at",
            "gantt_bar_color_mode",
            "gantt_bar_custom_color",
        ]
        read_only_fields = fields
