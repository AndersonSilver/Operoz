"""
Serializers for Workflow Engine
"""

from rest_framework import serializers
from .base import DynamicBaseSerializer
from operoz.db.models import (
    Workflow,
    WorkflowTransition,
    TransitionCondition,
    TransitionValidator,
    TransitionPostFunction,
    TransitionScreen,
    WorkflowScheme,
    WorkflowSchemeEntry,
    State,
    IssueType,
)


class TransitionConditionSerializer(DynamicBaseSerializer):
    class Meta:
        model = TransitionCondition
        fields = [
            "id",
            "condition_type",
            "config",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TransitionValidatorSerializer(DynamicBaseSerializer):
    class Meta:
        model = TransitionValidator
        fields = [
            "id",
            "validator_type",
            "config",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TransitionPostFunctionSerializer(DynamicBaseSerializer):
    class Meta:
        model = TransitionPostFunction
        fields = [
            "id",
            "function_type",
            "config",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TransitionScreenSerializer(DynamicBaseSerializer):
    class Meta:
        model = TransitionScreen
        fields = [
            "id",
            "fields",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkflowTransitionSerializer(DynamicBaseSerializer):
    conditions = TransitionConditionSerializer(many=True, read_only=True)
    validators = TransitionValidatorSerializer(many=True, read_only=True)
    post_functions = TransitionPostFunctionSerializer(many=True, read_only=True)
    screen = TransitionScreenSerializer(read_only=True)
    from_state = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )
    to_state = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=True
    )

    class Meta:
        model = WorkflowTransition
        fields = [
            "id",
            "workflow",
            "from_state",
            "to_state",
            "name",
            "is_global",
            "sort_order",
            "conditions",
            "validators",
            "post_functions",
            "screen",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class WorkflowSerializer(DynamicBaseSerializer):
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)
    initial_state = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Workflow
        fields = [
            "id",
            "workspace",
            "name",
            "description",
            "is_active",
            "is_draft",
            "initial_state",
            "published_at",
            "published_version",
            "published_graph",
            "transitions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "published_at",
            "published_version",
            "created_at",
            "updated_at",
        ]


class WorkflowGraphSerializer(serializers.Serializer):
    """
    Serializer for workflow graph representation (nodes and edges).
    Used by the visual editor to save/load workflow graphs.
    """
    nodes = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    edges = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )

    def validate_nodes(self, value):
        """Validate that all nodes have required fields"""
        for node in value:
            if "id" not in node or "data" not in node:
                raise serializers.ValidationError("Each node must have 'id' and 'data' fields")
            if "state_id" not in node["data"]:
                raise serializers.ValidationError("Each node must have a 'state_id' in its data")
        return value

    def validate_edges(self, value):
        """Validate that all edges have required fields"""
        for edge in value:
            if "id" not in edge or "source" not in edge or "target" not in edge:
                raise serializers.ValidationError("Each edge must have 'id', 'source', and 'target' fields")
        return value


class WorkflowSchemeEntrySerializer(DynamicBaseSerializer):
    issue_type = serializers.PrimaryKeyRelatedField(
        queryset=IssueType.objects.all(),
        required=False,
        allow_null=True
    )
    workflow = serializers.PrimaryKeyRelatedField(
        queryset=Workflow.objects.all(),
        required=True
    )

    class Meta:
        model = WorkflowSchemeEntry
        fields = [
            "id",
            "scheme",
            "issue_type",
            "workflow",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class WorkflowSchemeEntryWriteSerializer(serializers.Serializer):
    issue_type = serializers.UUIDField(required=False, allow_null=True)
    workflow = serializers.UUIDField(required=True)


class WorkflowSchemeWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    is_default = serializers.BooleanField(required=False)
    entries = WorkflowSchemeEntryWriteSerializer(many=True, required=False)


class BootstrapSchemeSerializer(serializers.Serializer):
    project_id = serializers.UUIDField(required=True)
    issue_type = serializers.UUIDField(required=False, allow_null=True)
    assign_project = serializers.BooleanField(required=False, default=True)
    mode = serializers.ChoiceField(
        choices=["linear", "open"],
        required=False,
        default="linear",
    )
    allow_back_transitions = serializers.BooleanField(required=False, default=False)
    back_transition_mode = serializers.ChoiceField(
        choices=["none", "adjacent", "last_only"],
        required=False,
        allow_null=True,
    )


class AssignSchemeProjectsSerializer(serializers.Serializer):
    project_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=True)


class WorkflowSchemeSerializer(DynamicBaseSerializer):
    entries = WorkflowSchemeEntrySerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowScheme
        fields = [
            "id",
            "workspace",
            "name",
            "is_default",
            "entries",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "created_at",
            "updated_at",
        ]


class IssueTransitionSerializer(DynamicBaseSerializer):
    """
    Serializer for available transitions on an issue.
    Used by the issue detail page to show available transitions.
    """
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField(read_only=True)
    to_state_id = serializers.UUIDField(read_only=True)
    to_state_name = serializers.CharField(read_only=True)
    to_state_group = serializers.CharField(read_only=True)
    screen = TransitionScreenSerializer(read_only=True)

    class Meta:
        model = WorkflowTransition
        fields = [
            "id",
            "name",
            "to_state_id",
            "to_state_name",
            "to_state_group",
            "screen",
        ]


class TransitionExecuteSerializer(serializers.Serializer):
    """
    Serializer for executing a transition.
    """
    comment = serializers.CharField(required=False, allow_blank=True)
    fields = serializers.DictField(required=False)


class TransitionExecutionErrorSerializer(serializers.Serializer):
    """Serializer for transition execution errors"""
    error = serializers.CharField()
    fields = serializers.DictField(required=False)
