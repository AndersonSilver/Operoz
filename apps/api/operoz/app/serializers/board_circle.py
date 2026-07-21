from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.app.serializers.user import UserLiteSerializer
from operoz.db.models import BoardCircle, BoardCircleMember


class BoardCircleSerializer(BaseSerializer):
    role_id = serializers.UUIDField(source="role.id", allow_null=True, default=None)
    role_name = serializers.CharField(source="role.name", allow_null=True, default=None)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = BoardCircle
        fields = [
            "id",
            "name",
            "description",
            "color",
            "role_id",
            "role_name",
            "member_count",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_member_count(self, obj):
        return BoardCircleMember.objects.filter(circle=obj, deleted_at__isnull=True).count()


class BoardCircleWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    color = serializers.CharField(required=False, allow_blank=True, default="")
    role_id = serializers.UUIDField(required=False, allow_null=True)


class BoardCircleUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    role_id = serializers.UUIDField(required=False, allow_null=True)


class BoardCircleMemberSerializer(BaseSerializer):
    member = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = BoardCircleMember
        fields = ["id", "user_id", "member", "email", "created_at"]
        read_only_fields = fields

    def get_member(self, obj):
        return UserLiteSerializer(obj.user).data

    def get_email(self, obj):
        return obj.user.email if obj.user else ""


class BoardCircleMemberAddSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)
