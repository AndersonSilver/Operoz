from rest_framework import serializers

from operis.app.serializers import BaseSerializer
from operis.db.models import BoardStatusReport


class BoardStatusReportSerializer(BaseSerializer):
    is_published = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    created_by_avatar = serializers.SerializerMethodField()
    module_name = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()

    class Meta:
        model = BoardStatusReport
        fields = [
            "id",
            "board",
            "project",
            "module",
            "module_name",
            "project_name",
            "title",
            "period_start",
            "period_end",
            "content",
            "published_at",
            "is_published",
            "created_by",
            "created_by_name",
            "created_by_avatar",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_is_published(self, obj):
        return obj.published_at is not None

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.display_name or obj.created_by.email

    def get_created_by_avatar(self, obj):
        if not obj.created_by:
            return None
        return obj.created_by.avatar_url

    def get_module_name(self, obj):
        return obj.module.name if obj.module_id else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None


class BoardStatusReportCreateSerializer(serializers.Serializer):
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
    executive_summary_html = serializers.CharField(required=False, allow_blank=True)


class ProjectStatusReportCreateSerializer(serializers.Serializer):
    module_id = serializers.UUIDField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
    executive_summary_html = serializers.CharField(required=False, allow_blank=True)


class ProjectStatusReportPreviewSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=["html", "md", "pdf"], default="html")
    executive_summary_html = serializers.CharField(required=False, allow_blank=True)
    em_execucao = serializers.ListField(child=serializers.CharField(), required=False)
    pontos_atencao = serializers.ListField(child=serializers.CharField(), required=False)


class BoardStatusReportUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
    period_start = serializers.DateField(required=False)
    period_end = serializers.DateField(required=False)
    content = serializers.JSONField(required=False)
    executive_summary_html = serializers.CharField(required=False, allow_blank=True)
    em_execucao = serializers.ListField(child=serializers.CharField(), required=False)
    pontos_atencao = serializers.ListField(child=serializers.CharField(), required=False)
    publish = serializers.BooleanField(required=False)
    unpublish = serializers.BooleanField(required=False)
