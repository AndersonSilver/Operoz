from rest_framework import serializers

from operis.db.models import BoardAutomationEmailTemplate, BoardAutomationScript


class BoardAutomationScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardAutomationScript
        fields = [
            "id",
            "name",
            "description",
            "source_code",
            "is_active",
            "board",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at", "created_by", "updated_by"]


class BoardAutomationEmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardAutomationEmailTemplate
        fields = [
            "id",
            "name",
            "description",
            "subject",
            "html_body",
            "is_active",
            "board",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at", "created_by", "updated_by"]
