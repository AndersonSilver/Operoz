from __future__ import annotations

import re
from typing import Any

from django.core.cache import cache
from django.db.models import QuerySet

from operoz.db.models import BoardIntakeForm, Project
from operoz.utils.intake_submission import IntakeSubmissionError, create_intake_submission
from operoz.utils.host import base_host


UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

PUBLIC_SUBMIT_RATE_LIMIT = 30
PUBLIC_SUBMIT_RATE_WINDOW_SECONDS = 60


def assert_public_intake_rate_limit(*, anchor: str, client_ip: str | None) -> None:
    ip = (client_ip or "unknown").strip()[:64]
    cache_key = f"board_intake_submit:{anchor}:{ip}"
    count = cache.get(cache_key, 0)
    if count >= PUBLIC_SUBMIT_RATE_LIMIT:
        raise IntakeSubmissionError("Muitas tentativas. Aguarde um minuto e tente novamente.")
    cache.set(cache_key, count + 1, PUBLIC_SUBMIT_RATE_WINDOW_SECONDS)


def board_intake_client_queryset(board_id) -> QuerySet[Project]:
    return (
        Project.objects.filter(
            board_id=board_id,
            archived_at__isnull=True,
            deleted_at__isnull=True,
            support_view=True,
        )
        .only("id", "name", "identifier", "board_id", "workspace_id", "support_view", "intake_view")
        .order_by("name")
    )


def serialize_board_intake_clients(projects: QuerySet[Project]) -> list[dict[str, str]]:
    return [
        {
            "id": str(project.id),
            "name": project.name,
            "identifier": project.identifier or "",
        }
        for project in projects
    ]


def _client_field_id(fields: list[dict[str, Any]]) -> str | None:
    for field in fields or []:
        if field.get("field_type") == "client":
            return field.get("id")
    return None


def _validate_project_id(value: str) -> str:
    candidate = (value or "").strip()
    if not candidate or not UUID_RE.match(candidate):
        raise IntakeSubmissionError(
            "Cliente inválido.",
            field_errors={"client": "Selecione um cliente válido."},
        )
    return candidate


def resolve_board_intake_project(*, board_id, project_id: str) -> Project:
    project = board_intake_client_queryset(board_id).filter(pk=project_id).select_related("workspace").first()
    if project is None:
        raise IntakeSubmissionError(
            "Cliente inválido ou Sustentação inativa.",
            field_errors={"client": "Cliente inválido ou Sustentação inativa para este board."},
        )
    return project


def extract_client_project_id(
    *, fields: list[dict[str, Any]], submission: dict[str, Any]
) -> tuple[str, dict[str, Any]]:
    field_id = _client_field_id(fields)
    if not field_id:
        raise IntakeSubmissionError("Formulário sem campo Cliente configurado.")

    raw = submission.get(field_id)
    project_id = _validate_project_id(str(raw or ""))
    if not project_id:
        raise IntakeSubmissionError(
            "Cliente é obrigatório.",
            field_errors={field_id: "Selecione o cliente."},
        )

    filtered = {key: value for key, value in submission.items() if key != field_id}
    return project_id, filtered


def validate_board_intake_form_fields(form: BoardIntakeForm) -> None:
    fields = form.fields or []
    if not _client_field_id(fields):
        raise IntakeSubmissionError("Formulário do board precisa incluir o campo Cliente.")
    if not any(field.get("field_type") == "name" for field in fields):
        raise IntakeSubmissionError("Formulário do board precisa incluir o campo Resumo.")


def submit_board_intake_form(
    *,
    form: BoardIntakeForm,
    submission: dict[str, Any],
    actor_id: str | None,
    submitter_email: str | None = None,
    request=None,
    client_ip: str | None = None,
):
    if not form.is_published:
        raise IntakeSubmissionError("Formulário não publicado.")

    assert_public_intake_rate_limit(anchor=form.anchor, client_ip=client_ip)
    validate_board_intake_form_fields(form)

    project_id, payload = extract_client_project_id(fields=form.fields or [], submission=submission)
    project = resolve_board_intake_project(board_id=form.board_id, project_id=project_id)
    origin = base_host(request=request, is_app=True) if request else None

    return create_intake_submission(
        project=project,
        submission=payload,
        actor_id=actor_id,
        intake_form=None,
        board_intake_form=form,
        source="PUBLIC_FORM",
        submitter_email=submitter_email,
        origin=origin,
    )


def get_published_board_intake_form(anchor: str) -> BoardIntakeForm:
    return BoardIntakeForm.objects.select_related("board", "workspace").get(
        anchor=anchor,
        is_published=True,
        deleted_at__isnull=True,
    )
