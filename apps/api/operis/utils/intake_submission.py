from __future__ import annotations

import json
from typing import Any

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape
from operis.automation.hooks import emit_intake_submitted, emit_issue_created
from operis.app.serializers import IssueCreateSerializer
from operis.bgtasks.issue_activities_task import issue_activity
from operis.db.models import (
    BoardIntakeForm,
    FileAsset,
    Intake,
    IntakeForm,
    IntakeIssue,
    IssueCustomFieldValue,
    Module,
    ModuleIssue,
    Project,
    State,
    StateGroup,
)
from operis.db.models.intake import SourceType, IntakeTicketKind
from operis.utils.host import base_host
from operis.utils.support_ticket import enrich_intake_extra


class IntakeSubmissionError(Exception):
    def __init__(self, message: str, *, field_errors: dict[str, str] | None = None):
        super().__init__(message)
        self.field_errors = field_errors or {}


def _normalize_uuid_list(value: Any) -> list[str]:
    """Normalize id lists stored as a single string or mixed shapes in form defaults."""
    if value is None or value == "" or value == []:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    return [str(value)]


def _stringify_serializer_errors(errors: Any) -> dict[str, str]:
    flattened: dict[str, str] = {}
    for key, value in dict(errors).items():
        if isinstance(value, list) and value:
            flattened[key] = str(value[0])
        elif isinstance(value, dict):
            nested = _stringify_serializer_errors(value)
            flattened[key] = ", ".join(nested.values()) if nested else "Inválido."
        else:
            flattened[key] = str(value)
    return flattened


def _ensure_triage_state(project: Project) -> State:
    triage_state = State.triage_objects.filter(project_id=project.id, workspace_id=project.workspace_id).first()
    if triage_state:
        return triage_state
    return State.objects.create(
        name="Triage",
        group=StateGroup.TRIAGE.value,
        project_id=project.id,
        workspace_id=project.workspace_id,
        color="#4E5355",
        sequence=65000,
        default=False,
    )


def _wrap_plain_description(value: str) -> str:
    stripped = (value or "").strip()
    if not stripped:
        return "<p></p>"
    if "<" in stripped and ">" in stripped:
        return stripped
    return f"<p>{escape(stripped).replace(chr(10), '<br/>')}</p>"


def _validate_submission_fields(form: IntakeForm, submission: dict[str, Any]) -> dict[str, Any]:
    return _validate_submission_fields_from_list(form.fields or [], submission)


def _validate_submission_fields_from_list(fields: list[dict[str, Any]], submission: dict[str, Any]) -> dict[str, Any]:
    errors: dict[str, str] = {}
    issue_payload: dict[str, Any] = {}
    custom_values: dict[str, Any] = {}
    support_extra: dict[str, Any] = {}
    attachment_asset_ids: list[str] = []

    for field in fields or []:
        field_id = field.get("id")
        if not field_id:
            continue
        field_type = field.get("field_type")
        if field_type == "client":
            continue
        required = bool(field.get("required"))
        label = field.get("label") or field_id
        raw = submission.get(field_id)

        if field_type in {"name"}:
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value:
                issue_payload["name"] = value[:255]
            continue

        if field_type in {"description", "paragraph"}:
            value = raw if isinstance(raw, str) else str(raw or "")
            if required and not value.strip():
                errors[field_id] = f"{label} é obrigatório."
            elif value.strip():
                maps_to = field.get("maps_to") or "description_html"
                if maps_to == "description_html":
                    issue_payload["description_html"] = _wrap_plain_description(value)
                else:
                    custom_values[field.get("custom_field_id") or field_id] = value
            continue

        if field_type == "text":
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value:
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = value
            continue

        if field_type in {"date", "datetime"}:
            value = (raw or "").strip() if isinstance(raw, str) else raw
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value:
                maps_to = field.get("maps_to")
                if maps_to == "problem_started_at":
                    support_extra["problem_started_at"] = value
                elif maps_to in {"start_date", "target_date"}:
                    issue_payload[maps_to] = value
                else:
                    custom_field_id = field.get("custom_field_id")
                    if custom_field_id:
                        custom_values[custom_field_id] = value
            continue

        if field_type == "criticality":
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            from operis.utils.support_criticality import is_valid_criticality

            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value and not is_valid_criticality(value):
                errors[field_id] = f"{label} inválido."
            elif value:
                support_extra["criticality"] = value
            continue

        if field_type == "ticket_number":
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value:
                support_extra["ticket_number"] = value[:64]
            continue

        if field_type == "sla_due":
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            if value:
                support_extra["sla_due_at"] = value
                support_extra["sla_due_at_overridden"] = True
            continue

        if field_type == "select":
            value = (raw or "").strip() if isinstance(raw, str) else raw
            options = field.get("options") or []
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value and options and value not in options:
                errors[field_id] = f"{label} inválido."
            elif value:
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = value
            continue

        if field_type == "priority":
            value = (raw or "none").strip() if isinstance(raw, str) else raw
            if value and value not in {"low", "medium", "high", "urgent", "none"}:
                errors[field_id] = f"{label} inválido."
            else:
                issue_payload["priority"] = value or "none"
            continue

        if field_type == "assignee":
            if required and not raw:
                errors[field_id] = f"{label} é obrigatório."
            elif raw:
                issue_payload.setdefault("assignee_ids", [])
                if isinstance(raw, list):
                    issue_payload["assignee_ids"].extend([str(item) for item in raw])
                else:
                    issue_payload["assignee_ids"].append(str(raw))
            continue

        if field_type == "number":
            if raw in (None, ""):
                if required:
                    errors[field_id] = f"{label} é obrigatório."
            else:
                try:
                    numeric = float(raw) if not isinstance(raw, (int, float)) else float(raw)
                except (TypeError, ValueError):
                    errors[field_id] = f"{label} inválido."
                    continue
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = numeric
            continue

        if field_type == "url":
            value = (raw or "").strip() if isinstance(raw, str) else str(raw or "").strip()
            if required and not value:
                errors[field_id] = f"{label} é obrigatório."
            elif value:
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = value
            continue

        if field_type == "checkbox":
            selected = raw if isinstance(raw, list) else ([raw] if raw else [])
            selected = [str(item) for item in selected if item]
            options = field.get("options") or []
            if required and not selected:
                errors[field_id] = f"{label} é obrigatório."
            elif selected and options and any(item not in options for item in selected):
                errors[field_id] = f"{label} inválido."
            elif selected:
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = selected
            continue

        if field_type == "labels":
            selected = raw if isinstance(raw, list) else ([raw] if raw else [])
            selected = [str(item).strip() for item in selected if str(item).strip()]
            options = field.get("options") or []
            if required and not selected:
                errors[field_id] = f"{label} é obrigatório."
            elif selected and options and any(item not in options for item in selected):
                errors[field_id] = f"{label} inválido."
            elif selected:
                custom_field_id = field.get("custom_field_id")
                if custom_field_id:
                    custom_values[custom_field_id] = selected
            continue

        if field_type == "attachment":
            asset_ids = raw if isinstance(raw, list) else ([raw] if raw else [])
            asset_ids = [str(item).strip() for item in asset_ids if str(item).strip()]
            if required and not asset_ids:
                errors[field_id] = f"{label} é obrigatório."
            elif asset_ids:
                attachment_asset_ids.extend(asset_ids)
            continue

    if errors:
        raise IntakeSubmissionError("Validação falhou.", field_errors=errors)

    if not issue_payload.get("name"):
        raise IntakeSubmissionError("Resumo é obrigatório.", field_errors={"name": "Resumo é obrigatório."})

    return {
        "issue": issue_payload,
        "custom_values": custom_values,
        "attachment_asset_ids": list(dict.fromkeys(attachment_asset_ids)),
        "support_extra": support_extra,
    }


def _bind_intake_form_attachments(
    *,
    project: Project,
    intake_form: IntakeForm | None,
    issue_id: str,
    asset_ids: list[str],
) -> None:
    if not asset_ids:
        return

    assets = FileAsset.objects.filter(
        id__in=asset_ids,
        workspace_id=project.workspace_id,
        project_id=project.id,
        entity_type=FileAsset.EntityTypeContext.INTAKE_FORM_ATTACHMENT,
        is_uploaded=True,
        is_deleted=False,
        issue_id__isnull=True,
    )
    if intake_form is not None:
        assets = assets.filter(entity_identifier=str(intake_form.id))

    found_ids = {str(asset_id) for asset_id in assets.values_list("id", flat=True)}
    missing = [asset_id for asset_id in asset_ids if asset_id not in found_ids]
    if missing:
        raise IntakeSubmissionError(
            "Anexo inválido ou não enviado.",
            field_errors={"attachment": "Um ou mais anexos são inválidos ou não foram enviados."},
        )

    assets.update(
        issue_id=issue_id,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
    )


def _bind_board_intake_form_attachments(
    *,
    board_intake_form: BoardIntakeForm,
    project: Project,
    issue_id: str,
    asset_ids: list[str],
) -> None:
    if not asset_ids:
        return

    assets = FileAsset.objects.filter(
        id__in=asset_ids,
        workspace_id=board_intake_form.workspace_id,
        project_id__isnull=True,
        entity_type=FileAsset.EntityTypeContext.BOARD_INTAKE_FORM_ATTACHMENT,
        is_uploaded=True,
        is_deleted=False,
        issue_id__isnull=True,
        entity_identifier=str(board_intake_form.id),
    )
    found_ids = {str(asset_id) for asset_id in assets.values_list("id", flat=True)}
    missing = [asset_id for asset_id in asset_ids if asset_id not in found_ids]
    if missing:
        raise IntakeSubmissionError(
            "Anexo inválido ou não enviado.",
            field_errors={"attachment": "Um ou mais anexos são inválidos ou não foram enviados."},
        )

    assets.update(
        issue_id=issue_id,
        project_id=project.id,
        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
    )


def _apply_form_defaults_from_dict(defaults: dict[str, Any], issue_payload: dict[str, Any]) -> dict[str, Any]:
    for key in ("priority", "start_date", "target_date", "parent_id"):
        if key not in issue_payload and defaults.get(key) not in (None, "", []):
            issue_payload[key] = defaults[key]
    for key in ("assignee_ids", "label_ids", "module_ids"):
        if not issue_payload.get(key) and defaults.get(key):
            issue_payload[key] = _normalize_uuid_list(defaults[key])
    return issue_payload


def _apply_form_defaults(form: IntakeForm, issue_payload: dict[str, Any]) -> dict[str, Any]:
    return _apply_form_defaults_from_dict(form.defaults or {}, issue_payload)


@transaction.atomic
def create_intake_submission(
    *,
    project: Project,
    submission: dict[str, Any],
    actor_id: str | None,
    intake_form: IntakeForm | None = None,
    board_intake_form: BoardIntakeForm | None = None,
    source: str = SourceType.IN_APP,
    submitter_email: str | None = None,
    origin: str | None = None,
    notify: bool = True,
) -> IntakeIssue:
    if board_intake_form is not None:
        if not project.support_view:
            raise IntakeSubmissionError("Sustentação não está ativa neste projeto.")
        ticket_kind = IntakeTicketKind.SUPPORT
    elif intake_form is not None:
        if not project.intake_view:
            raise IntakeSubmissionError("Intake não está ativo neste projeto.")
        ticket_kind = IntakeTicketKind.INTAKE
    else:
        if not project.intake_view and not project.support_view:
            raise IntakeSubmissionError("Intake ou sustentação deve estar ativo neste projeto.")
        ticket_kind = IntakeTicketKind.INTAKE if project.intake_view else IntakeTicketKind.SUPPORT

    intake = Intake.objects.filter(project_id=project.id, workspace_id=project.workspace_id).first()
    if intake is None:
        raise IntakeSubmissionError("Intake não configurado para este projeto.")

    if intake_form is not None and board_intake_form is not None:
        raise IntakeSubmissionError("Formulário inválido.")

    if intake_form is not None:
        if intake_form.project_id != project.id:
            raise IntakeSubmissionError("Formulário inválido para este projeto.")
        if not intake_form.is_published:
            raise IntakeSubmissionError("Formulário não publicado.")

    if board_intake_form is not None:
        if str(project.board_id) != str(board_intake_form.board_id):
            raise IntakeSubmissionError("Cliente não pertence a este board.")
        if not board_intake_form.is_published:
            raise IntakeSubmissionError("Formulário não publicado.")

    form_fields: list[dict[str, Any]] = []
    if intake_form is not None:
        parsed = _validate_submission_fields(intake_form, submission)
        issue_payload = _apply_form_defaults(intake_form, dict(parsed["issue"]))
        form_defaults = intake_form.defaults or {}
        form_fields = intake_form.fields or []
    elif board_intake_form is not None:
        parsed = _validate_submission_fields_from_list(board_intake_form.fields or [], submission)
        defaults = dict(board_intake_form.defaults or {})
        defaults.pop("assignee_ids", None)
        issue_payload = _apply_form_defaults_from_dict(defaults, dict(parsed["issue"]))
        form_defaults = board_intake_form.defaults or {}
        form_fields = board_intake_form.fields or []
    else:
        parsed = {
            "issue": submission.get("issue", submission),
            "custom_values": submission.get("custom_values", {}),
            "attachment_asset_ids": [],
        }
        issue_payload = dict(parsed["issue"])
        form_defaults = {}

    custom_values: dict[str, Any] = parsed.get("custom_values") or {}
    attachment_asset_ids: list[str] = parsed.get("attachment_asset_ids") or []
    support_extra: dict[str, Any] = parsed.get("support_extra") or {}

    if board_intake_form is not None:
        issue_payload.pop("assignee_ids", None)

    triage_state = _ensure_triage_state(project)
    issue_payload["state_id"] = triage_state.id
    issue_payload.setdefault("description_html", issue_payload.get("description_html") or "<p></p>")
    issue_payload.setdefault("priority", issue_payload.get("priority") or "none")

    serializer = IssueCreateSerializer(
        data=issue_payload,
        context={
            "project_id": str(project.id),
            "workspace_id": str(project.workspace_id),
            "default_assignee_id": project.default_assignee_id,
            "allow_triage_state": True,
        },
    )
    if not serializer.is_valid():
        raise IntakeSubmissionError(
            "Dados inválidos.",
            field_errors=_stringify_serializer_errors(serializer.errors),
        )

    issue = serializer.save()
    if board_intake_form is not None:
        _bind_board_intake_form_attachments(
            board_intake_form=board_intake_form,
            project=project,
            issue_id=str(issue.id),
            asset_ids=attachment_asset_ids,
        )
    else:
        _bind_intake_form_attachments(
            project=project,
            intake_form=intake_form,
            issue_id=str(issue.id),
            asset_ids=attachment_asset_ids,
        )
    module_ids = _normalize_uuid_list(
        issue_payload.get("module_ids") or form_defaults.get("module_ids")
    )
    if module_ids:
        valid_module_ids = Module.objects.filter(
            project_id=project.id,
            workspace_id=project.workspace_id,
            id__in=module_ids,
            archived_at__isnull=True,
            deleted_at__isnull=True,
        ).values_list("id", flat=True)
        ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    module_id=module_id,
                    issue=issue,
                    project_id=project.id,
                    workspace_id=project.workspace_id,
                    created_by_id=actor_id,
                    updated_by_id=actor_id,
                )
                for module_id in valid_module_ids
            ],
            ignore_conflicts=True,
        )

    for custom_field_id, value in custom_values.items():
        if value in (None, ""):
            continue
        IssueCustomFieldValue.objects.update_or_create(
            issue=issue,
            custom_field_id=custom_field_id,
            project_id=project.id,
            workspace_id=project.workspace_id,
            defaults={"value": value},
        )

    intake_issue = IntakeIssue.objects.create(
        intake_id=intake.id,
        project_id=project.id,
        issue=issue,
        source=source,
        source_email=submitter_email,
        intake_form=intake_form,
        board_intake_form=board_intake_form,
        ticket_kind=ticket_kind,
        extra=enrich_intake_extra(
            intake_form=intake_form,
            board_intake_form=board_intake_form,
            submission=submission,
            fields=form_fields,
            support_extra=support_extra if board_intake_form else None,
            board_id=project.board_id if board_intake_form else None,
            opened_at=timezone.now(),
            default_assignee_id=project.default_assignee_id if board_intake_form else None,
        ),
    )

    issue_activity.delay(
        type="issue.activity.created",
        requested_data=json.dumps({"issue": issue_payload, "submission": submission}, cls=DjangoJSONEncoder),
        actor_id=str(actor_id) if actor_id else None,
        issue_id=str(issue.id),
        project_id=str(project.id),
        current_instance=None,
        epoch=int(timezone.now().timestamp()),
        notification=notify,
        origin=origin,
        intake=str(intake_issue.id),
    )

    emit_issue_created(issue, actor_id=actor_id)
    emit_intake_submitted(
        issue,
        actor_id=actor_id,
        intake_form_id=str(intake_form.id) if intake_form else None,
        board_intake_form_id=str(board_intake_form.id) if board_intake_form else None,
        source=source,
    )

    return intake_issue


def submit_intake_form(
    *,
    form: IntakeForm,
    submission: dict[str, Any],
    actor_id: str | None,
    submitter_email: str | None = None,
    request=None,
) -> IntakeIssue:
    project = Project.objects.select_related("workspace").get(pk=form.project_id)
    origin = base_host(request=request, is_app=True) if request else None
    return create_intake_submission(
        project=project,
        submission=submission,
        actor_id=actor_id,
        intake_form=form,
        source=SourceType.PUBLIC_FORM,
        submitter_email=submitter_email,
        origin=origin,
    )
