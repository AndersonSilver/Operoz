from rest_framework import serializers

from operoz.app.serializers.base import BaseSerializer
from operoz.db.models import IntakeForm
from operoz.utils.intake_form_anchor import unique_project_intake_form_anchor


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

    def create(self, validated_data):
        project = validated_data.get("project")
        name = validated_data.get("name", "")
        if project is not None:
            validated_data["anchor"] = unique_project_intake_form_anchor(project.id, name)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        name = validated_data.get("name")
        if name and name != instance.name and not instance.is_published:
            validated_data["anchor"] = unique_project_intake_form_anchor(
                instance.project_id,
                name,
                exclude_id=instance.id,
            )
        return super().update(instance, validated_data)


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
