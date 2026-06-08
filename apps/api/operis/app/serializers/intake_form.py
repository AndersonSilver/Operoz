from rest_framework import serializers

from operis.app.serializers.base import BaseSerializer
from operis.db.models import IntakeForm


class IntakeFormSerializer(BaseSerializer):
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = IntakeForm
        fields = [
            "id",
            "project",
            "name",
            "description",
            "header_title",
            "anchor",
            "is_published",
            "fields",
            "defaults",
            "submit_message",
            "require_auth",
            "public_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "project", "anchor", "public_url", "created_at", "updated_at"]

    def get_public_url(self, obj: IntakeForm) -> str | None:
        request = self.context.get("request")
        if not obj.is_published:
            return None
        if request is None:
            return f"/forms/{obj.anchor}"
        return request.build_absolute_uri(f"/forms/{obj.anchor}")


class IntakeFormWriteSerializer(BaseSerializer):
    class Meta:
        model = IntakeForm
        fields = [
            "name",
            "description",
            "header_title",
            "is_published",
            "fields",
            "defaults",
            "submit_message",
            "require_auth",
        ]


class IntakeFormPublicSerializer(BaseSerializer):
    class Meta:
        model = IntakeForm
        fields = [
            "id",
            "name",
            "header_title",
            "description",
            "fields",
            "submit_message",
            "require_auth",
            "project",
        ]
        read_only_fields = fields
