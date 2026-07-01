from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.db.models import BoardSupportSlaPolicy
from operoz.utils.board_support_sla import normalize_policies
from operoz.utils.support_criticality import CRITICALITY_VALUES


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
