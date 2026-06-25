from rest_framework import serializers

from operis.app.serializers.base import BaseSerializer
from operis.db.models import BoardModuleStage


class BoardModuleStageSerializer(BaseSerializer):
    class Meta:
        model = BoardModuleStage
        fields = [
            "id",
            "board",
            "workspace",
            "name",
            "slug",
            "color",
            "sort_order",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "workspace", "slug", "created_at", "updated_at"]

    def validate_name(self, value):
        board_id = self.context.get("board_id")
        if not board_id:
            return value
        qs = BoardModuleStage.objects.filter(board_id=board_id, name=value, deleted_at__isnull=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("MODULE_STAGE_NAME_ALREADY_EXISTS")
        return value


class BoardModuleStageCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=64)
    color = serializers.CharField(max_length=7, required=False, default="#00b8a9")
    sort_order = serializers.FloatField(required=False)
    is_default = serializers.BooleanField(required=False, default=False)
    is_active = serializers.BooleanField(required=False, default=True)
