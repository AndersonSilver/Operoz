"""Mapeia custom fields de data do Jira para campos custom do board Operoz."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from operis.db.models import (
    Board,
    BoardCustomField,
    CustomFieldType,
    Issue,
    IssueCustomFieldValue,
    Project,
    User,
    Workspace,
    WorkspaceCustomField,
)
from operis.utils.board_custom_fields import (
    slugify_field_key,
    sync_board_custom_fields_to_project,
    unique_field_key,
)

from .jira_dates import _parse_jira_date


@dataclass(frozen=True)
class JiraCustomFieldSpec:
    operoz_name: str
    field_type: str
    jira_name_hints: tuple[str, ...]


JIRA_SYNC_CUSTOM_FIELD_SPECS: tuple[JiraCustomFieldSpec, ...] = (
    JiraCustomFieldSpec(
        operoz_name="Data de início do problema",
        field_type=CustomFieldType.DATE.value,
        jira_name_hints=("data de início do problema", "data de inicio do problema"),
    ),
    JiraCustomFieldSpec(
        operoz_name="SLA do chamado",
        field_type=CustomFieldType.DATE.value,
        jira_name_hints=("sla do chamado",),
    ),
)


@dataclass
class JiraCustomFieldImportContext:
    """Campos custom Operoz + ids Jira resolvidos para um import/sync."""

    operoz_fields: dict[str, WorkspaceCustomField]
    jira_field_ids: dict[str, str]


def resolve_jira_custom_field_ids(
    field_metadata: list[dict],
    specs: tuple[JiraCustomFieldSpec, ...] = JIRA_SYNC_CUSTOM_FIELD_SPECS,
) -> dict[str, str]:
    """Retorna operoz_name -> jira field id (ex.: customfield_10402)."""
    resolved: dict[str, str] = {}

    for spec in specs:
        best_id: str | None = None
        best_score = -1
        for field in field_metadata:
            if not isinstance(field, dict):
                continue
            schema = field.get("schema") or {}
            if schema.get("type") not in {"date", "datetime"}:
                continue
            field_id = (field.get("id") or "").strip()
            if not field_id:
                continue
            name = (field.get("name") or "").lower()
            for hint in spec.jira_name_hints:
                if hint in name:
                    score = len(hint)
                    if score > best_score:
                        best_score = score
                        best_id = field_id
                    break
        if best_id:
            resolved[spec.operoz_name] = best_id

    return resolved


def jira_custom_field_search_ids(jira_field_ids: dict[str, str]) -> list[str]:
    return list(dict.fromkeys(jira_field_ids.values()))


def ensure_operoz_custom_fields_for_jira(
    board: Board,
    workspace: Workspace,
    actor: User,
    specs: tuple[JiraCustomFieldSpec, ...] = JIRA_SYNC_CUSTOM_FIELD_SPECS,
) -> dict[str, WorkspaceCustomField]:
    """Garante campos custom no workspace/board; retorna operoz_name -> WorkspaceCustomField."""
    operoz_fields: dict[str, WorkspaceCustomField] = {}
    next_sort = (
        BoardCustomField.objects.filter(board=board, deleted_at__isnull=True)
        .order_by("-sort_order")
        .values_list("sort_order", flat=True)
        .first()
        or 0
    )

    for spec in specs:
        custom_field = WorkspaceCustomField.objects.filter(
            workspace_id=workspace.id,
            name=spec.operoz_name,
            deleted_at__isnull=True,
        ).first()

        if not custom_field:
            custom_field = WorkspaceCustomField.objects.create(
                workspace_id=workspace.id,
                name=spec.operoz_name,
                key=unique_field_key(workspace.id, slugify_field_key(spec.operoz_name)),
                field_type=spec.field_type,
                created_by=actor,
            )
        elif custom_field.field_type != spec.field_type:
            continue

        operoz_fields[spec.operoz_name] = custom_field

        board_link = (
            BoardCustomField.objects.filter(board=board, custom_field=custom_field)
            .order_by("-created_at")
            .first()
        )
        if board_link and board_link.deleted_at is None:
            if not board_link.is_enabled:
                board_link.is_enabled = True
                board_link.save(update_fields=["is_enabled", "updated_at"])
        else:
            next_sort += 1000
            if board_link and board_link.deleted_at is not None:
                board_link.deleted_at = None
                board_link.is_enabled = True
                board_link.sort_order = next_sort
                board_link.save(update_fields=["deleted_at", "is_enabled", "sort_order", "updated_at"])
            else:
                BoardCustomField.objects.create(
                    board=board,
                    workspace=workspace,
                    custom_field=custom_field,
                    sort_order=next_sort,
                    is_enabled=True,
                    created_by=actor,
                )

    return operoz_fields


def build_custom_field_import_context(
    board: Board,
    workspace: Workspace,
    actor: User,
    field_metadata: list[dict],
) -> JiraCustomFieldImportContext:
    jira_field_ids = resolve_jira_custom_field_ids(field_metadata)
    operoz_fields = ensure_operoz_custom_fields_for_jira(board, workspace, actor)
    return JiraCustomFieldImportContext(operoz_fields=operoz_fields, jira_field_ids=jira_field_ids)


def jira_custom_field_values_from_issue(
    fields: dict[str, Any],
    ctx: JiraCustomFieldImportContext,
) -> dict[str, str | None]:
    """Retorna operoz_name -> ISO date string ou None."""
    values: dict[str, str | None] = {}
    for operoz_name, jira_id in ctx.jira_field_ids.items():
        if operoz_name not in ctx.operoz_fields:
            continue
        parsed = _parse_jira_date(fields.get(jira_id))
        values[operoz_name] = parsed.isoformat() if parsed else None
    return values


def issue_jira_custom_fields_would_update(
    issue: Issue,
    fields: dict[str, Any],
    ctx: JiraCustomFieldImportContext,
) -> bool:
    incoming = jira_custom_field_values_from_issue(fields, ctx)
    if not incoming:
        return False

    existing = {
        row.custom_field_id: row.value
        for row in IssueCustomFieldValue.objects.filter(
            issue=issue,
            custom_field_id__in=[f.id for f in ctx.operoz_fields.values()],
            deleted_at__isnull=True,
        )
    }

    for operoz_name, value in incoming.items():
        custom_field = ctx.operoz_fields.get(operoz_name)
        if not custom_field:
            continue
        current = existing.get(custom_field.id)
        normalized_current = current if isinstance(current, str) else (current or None)
        if value != normalized_current and not (value in (None, "") and normalized_current in (None, "", {})):
            return True
    return False


def sync_issue_jira_custom_fields(
    issue: Issue,
    fields: dict[str, Any],
    ctx: JiraCustomFieldImportContext,
    project: Project,
    workspace: Workspace,
    actor: User,
) -> bool:
    """Persiste valores custom; retorna True se algo mudou."""
    incoming = jira_custom_field_values_from_issue(fields, ctx)
    if not incoming:
        return False

    changed = False
    for operoz_name, value in incoming.items():
        custom_field = ctx.operoz_fields.get(operoz_name)
        if not custom_field:
            continue

        if value in (None, ""):
            cleared = False
            for row in IssueCustomFieldValue.objects.filter(
                issue=issue,
                custom_field=custom_field,
                deleted_at__isnull=True,
            ):
                row.delete(soft=True)
                cleared = True
            if cleared:
                changed = True
            continue

        obj, created = IssueCustomFieldValue.objects.update_or_create(
            issue=issue,
            custom_field=custom_field,
            defaults={
                "value": value,
                "project_id": project.id,
                "workspace_id": workspace.id,
                "updated_by": actor,
            },
        )
        if created:
            obj.created_by = actor
            obj.save(update_fields=["created_by", "updated_at"])
            changed = True
        elif obj.value != value:
            changed = True

    return changed


def prepare_board_projects_for_jira_custom_fields(board: Board, actor: User) -> None:
    from operis.db.models import Project

    projects = Project.objects.filter(board_id=board.id, archived_at__isnull=True, deleted_at__isnull=True)
    for project in projects:
        sync_board_custom_fields_to_project(project, actor)
