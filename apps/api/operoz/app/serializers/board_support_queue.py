from rest_framework import serializers

from operoz.db.models import BoardSupportQueue


class BoardSupportQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardSupportQueue
        fields = [
            "id",
            "name",
            "slug",
            "color",
            "sort_order",
            "is_default",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class BoardSupportQueueWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardSupportQueue
        fields = ["name", "color", "sort_order", "is_default", "description"]

    def validate(self, attrs):
        board = self.context.get("board")
        is_default = attrs.get("is_default", getattr(self.instance, "is_default", False))
        if board and is_default:
            qs = BoardSupportQueue.objects.filter(board=board, is_default=True, deleted_at__isnull=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists() and attrs.get("is_default") is True:
                qs.update(is_default=False)
        return attrs
