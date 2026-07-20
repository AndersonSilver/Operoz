# Third party frameworks
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from .issue import IssueIntakeSerializer, LabelLiteSerializer, IssueDetailSerializer
from .project import ProjectLiteSerializer
from .state import StateLiteSerializer
from .user import UserLiteSerializer
from operoz.db.models import Intake, IntakeIssue, Issue, Project
from operoz.db.models.intake import IntakeTicketKind, IntakeOutcome
from operoz.utils.intake_workflow import promote_issue_to_backlog, convert_intake_to_project, IntakeConvertError
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
    # E1 — cross-project convert
    destination_project_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # E2 — typed outcomes
    outcome = serializers.ChoiceField(
        choices=IntakeOutcome.choices,
        write_only=True,
        required=False,
        allow_null=True,
    )
    outcome_note = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    deferred_until = serializers.DateField(write_only=True, required=False, allow_null=True)
    # E5 — pedir complemento
    awaiting_info = serializers.BooleanField(write_only=True, required=False, default=False)

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
            # E1
            "destination_project_id",
            # E2
            "outcome",
            "outcome_note",
            "deferred_until",
            "converted_to_issue",
            # E5
            "awaiting_info",
        ]
        read_only_fields = ["project", "workspace", "ticket_kind", "converted_to_issue"]

    def get_support_ticket(self, instance):
        if getattr(instance, "ticket_kind", None) == IntakeTicketKind.INTAKE:
            return None
        return serialize_support_ticket_metadata(instance, getattr(instance, "project", None))

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        reopen = attrs.pop("reopen", False)
        attrs["_reopen"] = reopen
        queue_id = attrs.get("queue_id")
        outcome = attrs.get("outcome")
        outcome_note = attrs.get("outcome_note") or ""
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
                    if queue_id is not None:
                        raise SupportTicketValidationError("Queue is not used for intake.", field="queue_id")
                    # consulting and deferred both map to CLOSED (status=3)
                    if outcome == IntakeOutcome.CONSULTING:
                        if not outcome_note.strip():
                            raise serializers.ValidationError(
                                {"outcome_note": "Nota é obrigatória para desfecho de consultoria."}
                            )
                        attrs["status"] = 3
                    elif outcome == IntakeOutcome.DEFERRED:
                        attrs["status"] = 3
                    elif status == 3 and outcome not in (IntakeOutcome.CONSULTING, IntakeOutcome.DEFERRED):
                        raise SupportTicketValidationError(
                            "Use outcome='consulting' ou 'deferred' para encerrar um intake.", field="status"
                        )
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
        # E1/E2/E5 extras
        destination_project_id = validated_data.pop("destination_project_id", None)
        outcome = validated_data.pop("outcome", None)
        outcome_note = validated_data.pop("outcome_note", None)
        deferred_until = validated_data.pop("deferred_until", None)
        awaiting_info = validated_data.pop("awaiting_info", False)

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

        # E2 — persist outcome fields before super().update()
        if outcome is not None:
            instance.outcome = outcome
        if outcome_note is not None:
            instance.outcome_note = outcome_note
        if deferred_until is not None:
            instance.deferred_until = deferred_until
        # E5
        if awaiting_info:
            instance.awaiting_info = True

        instance = super().update(instance, validated_data)

        if instance.ticket_kind == IntakeTicketKind.INTAKE and new_status == 1 and previous_status != 1 and project:
            # E1 — cross-project convert
            if destination_project_id and str(destination_project_id) != str(project.id):
                try:
                    dest_project = Project.objects.get(
                        pk=destination_project_id,
                        workspace_id=project.workspace_id,
                    )
                except Project.DoesNotExist:
                    raise serializers.ValidationError(
                        {"destination_project_id": "Projeto destino não encontrado neste workspace."}
                    )
                try:
                    dest_issue = convert_intake_to_project(instance, dest_project, actor_id)
                except IntakeConvertError as exc:
                    raise serializers.ValidationError({"destination_project_id": str(exc)}) from exc
                instance.outcome = IntakeOutcome.CONVERTED
                instance.save(update_fields=["converted_to_issue", "outcome", "awaiting_info", "outcome_note", "deferred_until"])
                from operoz.automation.hooks import emit_intake_converted
                emit_intake_converted(
                    instance.issue,
                    actor_id=actor_id,
                    destination_project_id=str(dest_project.id),
                    destination_issue_id=str(dest_issue.id),
                )
            else:
                promote_issue_to_backlog(instance.issue, project)
                if outcome is None:
                    instance.outcome = IntakeOutcome.CONVERTED
                    instance.save(update_fields=["outcome"])
                from operoz.automation.hooks import emit_intake_converted
                emit_intake_converted(
                    instance.issue,
                    actor_id=actor_id,
                    destination_project_id=str(project.id),
                    destination_issue_id=str(instance.issue.id),
                )

        elif instance.ticket_kind == IntakeTicketKind.INTAKE and new_status == -1 and previous_status != -1:
            instance.outcome = IntakeOutcome.REJECTED
            instance.save(update_fields=["outcome"])
            from operoz.automation.hooks import emit_intake_rejected
            emit_intake_rejected(
                instance.issue,
                actor_id=actor_id,
                decline_category=decline_category,
                decline_reason=decline_reason,
            )

        elif instance.ticket_kind == IntakeTicketKind.INTAKE and outcome == IntakeOutcome.DEFERRED and new_status in (0, 3):
            from operoz.automation.hooks import emit_intake_deferred
            emit_intake_deferred(
                instance.issue,
                actor_id=actor_id,
                deferred_until=str(deferred_until) if deferred_until else None,
            )

        elif instance.ticket_kind == IntakeTicketKind.INTAKE and outcome == IntakeOutcome.CONSULTING and new_status == 3:
            from operoz.automation.hooks import emit_intake_consulting
            emit_intake_consulting(
                instance.issue,
                actor_id=actor_id,
                outcome_note=outcome_note,
            )

        elif instance.ticket_kind == IntakeTicketKind.INTAKE and awaiting_info:
            instance.save(update_fields=["awaiting_info"])
            from operoz.automation.hooks import emit_intake_needs_info
            emit_intake_needs_info(instance.issue, actor_id=actor_id)

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
            "ticket_kind",
            "outcome",
            "converted_to_issue",
        ]
        read_only_fields = ["project", "workspace", "ticket_kind", "outcome", "converted_to_issue"]

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
