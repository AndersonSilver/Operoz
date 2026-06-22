from rest_framework import serializers

from operis.app.serializers.base import BaseSerializer
from operis.db.models import BoardSupportSlaPolicy
from operis.utils.board_support_sla import normalize_policies
from operis.utils.support_criticality import CRITICALITY_VALUES


class BoardSupportSlaPolicySerializer(BaseSerializer):
    class Meta:
        model = BoardSupportSlaPolicy
        fields = ["id", "board", "policies", "created_at", "updated_at"]
        read_only_fields = ["board", "created_at", "updated_at"]


class BoardSupportSlaPolicyWriteSerializer(serializers.Serializer):
    policies = serializers.DictField()

    def validate_policies(self, value):
        normalized = normalize_policies(value)
        for key in CRITICALITY_VALUES:
            if key not in normalized:
                raise serializers.ValidationError(f"Missing policy for {key}.")
        return normalized
