from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.db.models import ProjectContact


class ProjectContactSerializer(BaseSerializer):
    class Meta:
        model = ProjectContact
        fields = [
            "id",
            "project",
            "workspace",
            "category",
            "full_name",
            "email",
            "role",
            "whatsapp",
            "is_lead",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "workspace", "created_at", "updated_at"]

    def validate_full_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Nome completo é obrigatório.")
        return value
