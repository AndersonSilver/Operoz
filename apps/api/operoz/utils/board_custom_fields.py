import re
import unicodedata

from operoz.db.models import (
    Board,
    BoardCustomField,
    IssueCustomFieldValue,
    Project,
    ProjectCustomField,
    WorkspaceCustomField,
)


def slugify_field_key(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    key = re.sub(r"[^a-zA-Z0-9]+", "_", ascii_name).strip("_").lower()
    return key[:48] or "field"


def unique_field_key(workspace_id, base_key: str) -> str:
    key = base_key
    suffix = 1
    while WorkspaceCustomField.objects.filter(workspace_id=workspace_id, key=key, deleted_at__isnull=True).exists():
        key = f"{base_key}_{suffix}"[:48]
        suffix += 1
    return key


def sync_board_custom_fields_to_project(project: Project, user=None) -> None:
    if not project.board_id:
        return

    board_fields = (
        BoardCustomField.objects.filter(
            board_id=project.board_id,
            is_enabled=True,
            deleted_at__isnull=True,
            custom_field__is_active=True,
            custom_field__deleted_at__isnull=True,
        )
        .select_related("custom_field")
        .order_by("sort_order", "custom_field__name")
    )

    for idx, board_field in enumerate(board_fields):
        ProjectCustomField.objects.get_or_create(
            project=project,
            custom_field=board_field.custom_field,
            workspace_id=project.workspace_id,
            defaults={"sort_order": board_field.sort_order if board_field.sort_order else float(idx * 1000)},
        )


def sync_board_custom_fields_to_all_board_projects(board: Board, user=None) -> None:
    projects = Project.objects.filter(board_id=board.id, archived_at__isnull=True, deleted_at__isnull=True)
    for project in projects:
        sync_board_custom_fields_to_project(project, user)


def delete_workspace_custom_field(field: WorkspaceCustomField, user=None) -> None:
    """Remove o campo do catálogo do workspace e de todos os boards/projetos."""
    field.is_active = False
    field.delete(soft=True)

    board_ids = set()
    for board_link in BoardCustomField.objects.filter(custom_field_id=field.id, deleted_at__isnull=True):
        board_link.is_enabled = False
        board_link.delete(soft=True)
        board_ids.add(board_link.board_id)

    for project_link in ProjectCustomField.objects.filter(custom_field_id=field.id, deleted_at__isnull=True):
        project_link.delete(soft=True)

    for issue_value in IssueCustomFieldValue.objects.filter(custom_field_id=field.id, deleted_at__isnull=True):
        issue_value.delete(soft=True)

    for board in Board.objects.filter(id__in=board_ids, deleted_at__isnull=True):
        sync_board_custom_fields_to_all_board_projects(board, user)


def get_project_enabled_custom_fields(project: Project):
    if not project.board_id:
        return WorkspaceCustomField.objects.none()

    return (
        WorkspaceCustomField.objects.filter(
            project_custom_fields__project_id=project.id,
            project_custom_fields__deleted_at__isnull=True,
            board_custom_fields__board_id=project.board_id,
            board_custom_fields__is_enabled=True,
            board_custom_fields__deleted_at__isnull=True,
            is_active=True,
            deleted_at__isnull=True,
        )
        .distinct()
        .order_by("project_custom_fields__sort_order", "name")
    )
