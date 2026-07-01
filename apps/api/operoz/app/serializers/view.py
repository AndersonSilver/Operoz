# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from operoz.db.models import IssueView
from operoz.utils.issue_filters import issue_filters


class ViewIssueListSerializer(serializers.Serializer):
    def get_assignee_ids(self, instance):
        return [assignee.assignee_id for assignee in instance.issue_assignee.all()]

    def get_label_ids(self, instance):
        return [label.label_id for label in instance.label_issue.all()]

    def get_module_ids(self, instance):
        return [module.module_id for module in instance.issue_module.all()]

    def get_custom_field_values(self, instance):
        values: dict[str, object] = {}
        for row in instance.custom_field_values.all():
            if getattr(row, "deleted_at", None):
                continue
            values[str(row.custom_field_id)] = row.value
        return values

    def to_representation(self, instance):
        data = {
            "id": instance.id,
            "name": instance.name,
            "state_id": instance.state_id,
            "type_id": instance.type_id,
            "sort_order": instance.sort_order,
            "completed_at": instance.completed_at,
            "estimate_point": instance.estimate_point_id,
            "priority": instance.priority,
            "start_date": instance.start_date,
            "target_date": instance.target_date,
            "sequence_id": instance.sequence_id,
            "project_id": instance.project_id,
            "parent_id": instance.parent_id,
            "cycle_id": instance.cycle_id,
            "sub_issues_count": instance.sub_issues_count,
            "created_at": instance.created_at,
            "updated_at": instance.updated_at,
            "created_by": instance.created_by_id,
            "updated_by": instance.updated_by_id,
            "attachment_count": instance.attachment_count,
            "link_count": instance.link_count,
            "is_draft": instance.is_draft,
            "archived_at": instance.archived_at,
            "state__group": instance.state.group if instance.state else None,
            "assignee_ids": self.get_assignee_ids(instance),
            "label_ids": self.get_label_ids(instance),
            "module_ids": self.get_module_ids(instance),
            "custom_field_values": self.get_custom_field_values(instance),
        }

        # Include relation data only when the view has prefetched it (e.g. Gantt expand).
        # Using _prefetched_objects_cache avoids triggering extra DB queries.
        prefetched = getattr(instance, "_prefetched_objects_cache", {})
        if "issue_relation" in prefetched:
            data["issue_relation"] = [
                {
                    "id": str(r.related_issue.id),
                    "relation_type": r.relation_type,
                    "name": r.related_issue.name,
                    "project_id": str(r.related_issue.project_id),
                    "sequence_id": r.related_issue.sequence_id,
                }
                for r in instance.issue_relation.all()
                if r.related_issue
            ]
        if "issue_related" in prefetched:
            data["issue_related"] = [
                {
                    "id": str(r.issue.id),
                    "relation_type": r.relation_type,
                    "name": r.issue.name,
                    "project_id": str(r.issue.project_id),
                    "sequence_id": r.issue.sequence_id,
                }
                for r in instance.issue_related.all()
                if r.issue
            ]

        return data


class IssueViewSerializer(DynamicBaseSerializer):
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = IssueView
        fields = "__all__"
        read_only_fields = [
            "workspace",
            "project",
            "query",
            "owned_by",
            "access",
            "is_locked",
        ]

    def create(self, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        return IssueView.objects.create(**validated_data)

    def update(self, instance, validated_data):
        query_params = validated_data.get("filters", {})
        if bool(query_params):
            validated_data["query"] = issue_filters(query_params, "POST")
        else:
            validated_data["query"] = {}
        validated_data["query"] = issue_filters(query_params, "PATCH")
        return super().update(instance, validated_data)
