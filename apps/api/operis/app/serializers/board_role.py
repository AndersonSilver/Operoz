from rest_framework import serializers

from operis.app.serializers.base import BaseSerializer
from operis.app.serializers.user import UserLiteSerializer
from operis.db.models import BoardMemberRole, BoardRole, BoardRolePermission
from operis.utils.board_roles import BOARD_PERMISSION_KEYS_V1, BOARD_PERMISSION_TREE


class BoardRolePermissionSerializer(BaseSerializer):
    permission_key = serializers.CharField()
    granted = serializers.BooleanField()

    class Meta:
        model = BoardRolePermission
        fields = ["permission_key", "granted"]


class BoardRoleSerializer(BaseSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = BoardRole
        fields = [
            "id",
            "name",
            "description",
            "slug",
            "is_system",
            "sort_order",
            "permissions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_permissions(self, obj):
        perms = BoardRolePermission.objects.filter(role=obj, deleted_at__isnull=True)
        return BoardRolePermissionSerializer(perms, many=True).data


class BoardRoleWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    permissions = serializers.DictField(child=serializers.BooleanField(), required=False)


class BoardRoleUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    permissions = serializers.DictField(child=serializers.BooleanField(), required=False)


class BoardPermissionCatalogSerializer(serializers.Serializer):
    keys_v1 = serializers.ListField(child=serializers.CharField())
    tree = serializers.ListField(child=serializers.DictField())


class BoardMemberRoleAssignmentSerializer(BaseSerializer):
    role_id = serializers.UUIDField(source="role.id")
    role_name = serializers.CharField(source="role.name")
    role_slug = serializers.CharField(source="role.slug")

    class Meta:
        model = BoardMemberRole
        fields = ["role_id", "role_name", "role_slug"]


class BoardMemberRolesUpdateSerializer(serializers.Serializer):
    role_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


class BoardMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    member = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    role_ids = serializers.SerializerMethodField()
    role_label = serializers.SerializerMethodField()

    def get_member(self, obj):
        return UserLiteSerializer(obj.user).data

    def get_email(self, obj):
        return getattr(obj, "email", None) or (obj.user.email if obj.user else "")

    def get_roles(self, obj):
        return BoardMemberRoleAssignmentSerializer(obj.assignments, many=True).data

    def get_role_ids(self, obj):
        return [str(a.role_id) for a in obj.assignments]

    def get_role_label(self, obj):
        names = [a.role.name for a in obj.assignments]
        if not names:
            return ""
        if len(names) == 1:
            return names[0]
        return f"Várias ({len(names)} funções)"


class BoardMemberAssignSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


def permission_catalog_payload():
    return {
        "keys_v1": BOARD_PERMISSION_KEYS_V1,
        "tree": BOARD_PERMISSION_TREE,
    }
