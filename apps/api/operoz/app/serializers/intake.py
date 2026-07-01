# Third party frameworks
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueIntakeSerializer, LabelLiteSerializer, IssueDetailSerializer
from .project import ProjectLiteSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer
from operoz.db.models import Intake, IntakeIssue, Issue
from operoz.db.models.intake import IntakeTicketKind
from operoz.utils.intake_workflow import promote_issue_to_backlog
from operoz.utils.support_ticket import (
    SupportTicketValidationError,
    apply_support_field_updates,
    apply_triage_extra_updates,
    serialize_support_ticket_metadata,
    validate_accept,
    validate_close,
    validate_decline,
    validate_move_queue,
    resolve_project_support_queue,
)


class IntakeSerializer(BaseSerializer):
    project_detail = ProjectLiteSerializer(source="project", read_only=True)
    pending_issue_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Intake
        fields = "__all__"
        read_only_fields = ["project", "workspace"]


class IntakeIssueSerializer(BaseSerializer):
    issue = IssueIntakeSerializer(read_only=True)
    source_email = serializers.EmailField(read_only=True)
    extra = serializers.JSONField(read_only=True)
    support_ticket = serializers.SerializerMethodField(read_only=True)
    decline_reason = serializers.CharField(write_only=True, required=False, allow_blank=True)
    decline_category = serializers.CharField(write_only=True, required=False, allow_blank=True)
    snooze_reason = serializers.CharField(write_only=True, required=False, allow_blank=True)
    reopen = serializers.BooleanField(write_only=True, required=False, default=False)
    queue_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    resolution_note = serializers.CharField(write_only=True, required=False, allow_blank=True)
    support_criticality = serializers.CharField(write_only=True, required=False, allow_blank=True)
    support_sla_due_at = serializers.CharField(write_only=True, required=False, allow_blank=True)
    reset_sla_from_criticality = serializers.BooleanField(write_only=True, required=False, default=False)
    support_ticket_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = IntakeIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "source",
            "source_email",
            "extra",
            "support_ticket",
            "issue",
            "created_by",
            "decline_reason",
            "decline_category",
            "snooze_reason",
            "reopen",
            "queue_id",
            "resolution_note",
            "support_criticality",
            "support_sla_due_at",
            "reset_sla_from_criticality",
            "support_ticket_number",
            "ticket_kind",
        ]
        read_only_fields = ["project", "workspace", "ticket_kind"]

    def get_support_ticket(self, instance):
        if getattr(instance, "ticket_kind", None) == IntakeTicketKind.INTAKE:
            return None
        return serialize_support_ticket_metadata(instance, getattr(instance, "project", None))

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        reopen = attrs.pop("reopen", False)
        attrs["_reopen"] = reopen
        queue_id = attrs.get("queue_id")
        project = getattr(self.instance, "project", None) if self.instance else None
        ticket_kind = getattr(self.instance, "ticket_kind", IntakeTicketKind.SUPPORT)

        if status == -1:
            try:
                validate_decline(
                    status=status,
                    decline_reason=attrs.get("decline_reason"),
                    decline_category=attrs.get("decline_category"),
                )
            except SupportTicketValidationError as exc:
                field = exc.field or "decline_reason"
                raise serializers.ValidationError({field: str(exc)}) from exc

        if project:
            try:
                if ticket_kind == IntakeTicketKind.SUPPORT:
                    if status == 1:
                        validate_accept(status=status, queue_id=str(queue_id) if queue_id else None, project=project)
                    elif status == 3:
                        validate_close(status=status, current_status=self.instance.status)
                    elif queue_id is not None and status is None and self.instance.status == 1:
                        validate_move_queue(
                            queue_id=str(queue_id),
                            current_status=self.instance.status,
                            project=project,
                        )
                elif ticket_kind == IntakeTicketKind.INTAKE:
                    if status == 3:
                        raise SupportTicketValidationError("Intake tickets cannot be closed.", field="status")
                    if queue_id is not None:
                        raise SupportTicketValidationError("Queue is not used for intake.", field="queue_id")
            except SupportTicketValidationError as exc:
                field = exc.field or "queue_id"
                raise serializers.ValidationError({field: str(exc)}) from exc

        if reopen and status not in (None, -2):
            attrs["status"] = -2

        return attrs

    def update(self, instance, validated_data):
        decline_reason = validated_data.pop("decline_reason", None)
        decline_category = validated_data.pop("decline_category", None)
        snooze_reason = validated_data.pop("snooze_reason", None)
        reopen = validated_data.pop("_reopen", False)
        queue_id = validated_data.pop("queue_id", None)
        resolution_note = validated_data.pop("resolution_note", None)
        support_criticality = validated_data.pop("support_criticality", None)
        support_sla_due_at = validated_data.pop("support_sla_due_at", None)
        reset_sla_from_criticality = validated_data.pop("reset_sla_from_criticality", False)
        support_ticket_number = validated_data.pop("support_ticket_number", None)
        new_status = validated_data.get("status", instance.status)
        previous_status = instance.status

        request = self.context.get("request")
        actor_id = str(request.user.id) if request and getattr(request, "user", None) else None
        project = getattr(instance, "project", None)

        if queue_id is not None and project and instance.ticket_kind == IntakeTicketKind.SUPPORT:
            queue = resolve_project_support_queue(project=project, queue_id=str(queue_id))
            instance.support_queue = queue

        apply_triage_extra_updates(
            instance,
            status=new_status if "status" in validated_data else None,
            decline_reason=decline_reason,
            decline_category=decline_category,
            snooze_reason=snooze_reason,
            reopen=reopen,
            actor_id=actor_id,
            resolution_note=resolution_note if instance.ticket_kind == IntakeTicketKind.SUPPORT else None,
        )

        if instance.ticket_kind == IntakeTicketKind.SUPPORT and (
            support_criticality is not None
            or support_sla_due_at is not None
            or support_ticket_number is not None
            or reset_sla_from_criticality
        ):
            try:
                apply_support_field_updates(
                    instance,
                    criticality=support_criticality if support_criticality else None,
                    sla_due_at=support_sla_due_at if support_sla_due_at else None,
                    reset_sla_from_criticality=reset_sla_from_criticality,
                    ticket_number=support_ticket_number if support_ticket_number is not None else None,
                    actor_id=actor_id,
                )
            except SupportTicketValidationError as exc:
                field = exc.field or "support_criticality"
                raise serializers.ValidationError({field: str(exc)}) from exc

        instance = super().update(instance, validated_data)

        if (
            instance.ticket_kind == IntakeTicketKind.INTAKE
            and new_status == 1
            and previous_status != 1
            and project
        ):
            promote_issue_to_backlog(instance.issue, project)

        return instance

    def to_representation(self, instance):
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids
        return super().to_representation(instance)


class IntakeIssueDetailSerializer(BaseSerializer):
    issue = IssueDetailSerializer(read_only=True)
    duplicate_issue_detail = IssueIntakeSerializer(read_only=True, source="duplicate_to")
    source_email = serializers.EmailField(read_only=True)
    extra = serializers.JSONField(read_only=True)
    support_ticket = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = IntakeIssue
        fields = [
            "id",
            "status",
            "duplicate_to",
            "snoozed_till",
            "duplicate_issue_detail",
            "source",
            "source_email",
            "extra",
            "support_ticket",
            "issue",
        ]
        read_only_fields = ["project", "workspace"]

    def get_support_ticket(self, instance):
        return serialize_support_ticket_metadata(instance, getattr(instance, "project", None))

    def to_representation(self, instance):
        if hasattr(instance, "assignee_ids"):
            instance.issue.assignee_ids = instance.assignee_ids
        if hasattr(instance, "label_ids"):
            instance.issue.label_ids = instance.label_ids

        return super().to_representation(instance)


class IntakeIssueLiteSerializer(BaseSerializer):
    class Meta:
        model = IntakeIssue
        fields = ["id", "status", "duplicate_to", "snoozed_till", "source"]
        read_only_fields = fields


class IssueStateIntakeSerializer(BaseSerializer):
    state_detail = StateLiteSerializer(read_only=True, source="state")
    project_detail = ProjectLiteSerializer(read_only=True, source="project")
    label_details = LabelLiteSerializer(read_only=True, source="labels", many=True)
    assignee_details = UserLiteSerializer(read_only=True, source="assignees", many=True)
    sub_issues_count = serializers.IntegerField(read_only=True)
    issue_intake = IntakeIssueLiteSerializer(read_only=True, many=True)

    class Meta:
        model = Issue
        fields = "__all__"
