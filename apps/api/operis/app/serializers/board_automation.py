from rest_framework import serializers

from operis.automation.rule_lifecycle import (
    rule_has_published_graph,
    rule_has_unpublished_changes,
)
from operis.db.models import BoardAutomationRule, BoardAutomationRuleRevision, BoardAutomationRun


class BoardAutomationRuleSerializer(serializers.ModelSerializer):
    has_unpublished_changes = serializers.SerializerMethodField()
    is_published = serializers.SerializerMethodField()
    publication_status = serializers.SerializerMethodField()

    class Meta:
        model = BoardAutomationRule
        fields = [
            "id",
            "name",
            "description",
            "enabled",
            "sort_order",
            "graph",
            "graph_version",
            "published_graph",
            "published_version",
            "published_at",
            "has_unpublished_changes",
            "is_published",
            "publication_status",
            "board",
            "workspace",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "board",
            "workspace",
            "published_graph",
            "published_version",
            "published_at",
            "has_unpublished_changes",
            "is_published",
            "publication_status",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_has_unpublished_changes(self, obj: BoardAutomationRule) -> bool:
        return rule_has_unpublished_changes(obj)

    def get_is_published(self, obj: BoardAutomationRule) -> bool:
        return rule_has_published_graph(obj)

    def get_publication_status(self, obj: BoardAutomationRule) -> str:
        if not rule_has_published_graph(obj):
            return "draft_only"
        if rule_has_unpublished_changes(obj):
            return "published_with_drafts"
        return "published"


class BoardAutomationRuleRevisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardAutomationRuleRevision
        fields = [
            "id",
            "rule",
            "kind",
            "graph",
            "name",
            "description",
            "graph_version",
            "created_at",
            "created_by",
        ]
        read_only_fields = fields


class BoardAutomationRunSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)

    class Meta:
        model = BoardAutomationRun
        fields = [
            "id",
            "rule",
            "rule_name",
            "board",
            "event_id",
            "event_type",
            "status",
            "dry_run",
            "context_snapshot",
            "graph_snapshot",
            "graph_version",
            "correlation_id",
            "step_logs",
            "error_message",
            "started_at",
            "finished_at",
            "created_at",
        ]
        read_only_fields = fields
