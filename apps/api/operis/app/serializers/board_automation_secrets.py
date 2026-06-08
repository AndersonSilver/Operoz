from rest_framework import serializers

from operis.db.models import BoardAutomationSecret
from operis.license.utils.encryption import encrypt_data


class BoardAutomationSecretSerializer(serializers.ModelSerializer):
    value = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = BoardAutomationSecret
        fields = ["id", "key", "description", "value", "workspace", "created_at", "updated_at"]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]

    def create(self, validated_data):
        raw_value = validated_data.pop("value", "")
        validated_data["value_encrypted"] = encrypt_data(raw_value)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_value = validated_data.pop("value", None)
        if raw_value is not None:
            instance.value_encrypted = encrypt_data(raw_value)
        return super().update(instance, validated_data)
