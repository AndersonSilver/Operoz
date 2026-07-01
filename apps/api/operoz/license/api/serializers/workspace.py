# Third Party Imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from operoz.db.models import Workspace
from operoz.utils.constants import RESTRICTED_WORKSPACE_SLUGS


class WorkspaceSerializer(BaseSerializer):
    owner = UserLiteSerializer(read_only=True)
    logo_url = serializers.CharField(read_only=True)
    total_projects = serializers.IntegerField(read_only=True)
    total_members = serializers.IntegerField(read_only=True)

    def validate_slug(self, value):
        # Check if the slug is restricted
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        # Check uniqueness case-insensitively
        if Workspace.objects.filter(slug__iexact=value).exists():
            raise serializers.ValidationError("Slug is already in use")
        return value

    class Meta:
        model = Workspace
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "owner",
            "logo_url",
        ]


class InstanceWorkspaceUpdateSerializer(BaseSerializer):
    """Partial update for instance admin (God Mode)."""

    def validate_slug(self, value):
        if value in RESTRICTED_WORKSPACE_SLUGS:
            raise serializers.ValidationError("Slug is not valid")
        qs = Workspace.objects.filter(slug__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Slug is already in use")
        return value

    def validate_name(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Name is required")
        if len(value) > 80:
            raise serializers.ValidationError("The maximum length for name is 80")
        return value.strip()

    class Meta:
        model = Workspace
        fields = ["name", "slug", "organization_size"]
