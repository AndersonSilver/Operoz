from rest_framework import serializers

from operoz.db.models import BoardAutomationHook


class BoardAutomationHookSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardAutomationHook
        fields = [
            "id",
            "name",
            "enabled",
            "event",
            "matcher",
            "handler_type",
            "config",
            "sort_order",
            "board",
            "workspace",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at"]
