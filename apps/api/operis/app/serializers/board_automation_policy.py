from rest_framework import serializers

from operis.db.models import BoardAutomationPolicy, BoardAutomationPublishAudit


class BoardAutomationPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardAutomationPolicy
        fields = [
            "id",
            "board",
            "workspace",
            "webhook_allowlist_enabled",
            "webhook_allowed_domains",
            "script_timeout_seconds",
            "script_max_memory_mb",
            "script_block_dangerous_imports",
            "require_dry_run_before_enable",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "board", "workspace", "created_at", "updated_at"]


class BoardAutomationPublishAuditSerializer(serializers.ModelSerializer):
    published_by_name = serializers.SerializerMethodField()
    rule_name = serializers.CharField(source="rule.name", read_only=True)

    class Meta:
        model = BoardAutomationPublishAudit
        fields = [
            "id",
            "rule",
            "rule_name",
            "board",
            "workspace",
            "published_version",
            "graph_diff",
            "published_by",
            "published_by_name",
            "published_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_published_by_name(self, obj: BoardAutomationPublishAudit) -> str:
        if not obj.published_by:
            return ""
        return obj.published_by.display_name or obj.published_by.email or str(obj.published_by_id)
