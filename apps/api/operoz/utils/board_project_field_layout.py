from operoz.db.models import (
    Board,
    BoardProjectFieldLayout,
    BoardProjectFieldSection,
    BoardProjectFieldSource,
    ProjectStandardFieldKey,
)

# Ordem e defaults do formulário de Projeto por board.
PROJECT_FIELD_DEFAULTS: list[tuple[str, str, float, bool, str]] = [
    # key, section, sort_order, is_required, form_span
    (ProjectStandardFieldKey.NAME, BoardProjectFieldSection.DESCRIPTION, 1000, True, "full"),
    (ProjectStandardFieldKey.IDENTIFIER, BoardProjectFieldSection.DESCRIPTION, 2000, True, "half"),
    (ProjectStandardFieldKey.PROJECT_LEAD, BoardProjectFieldSection.DESCRIPTION, 3000, False, "half"),
    (ProjectStandardFieldKey.RESPONSIBLE_STAKEHOLDER, BoardProjectFieldSection.DESCRIPTION, 3500, False, "half"),
    (ProjectStandardFieldKey.DESCRIPTION, BoardProjectFieldSection.DESCRIPTION, 4000, False, "full"),
    (ProjectStandardFieldKey.NETWORK, BoardProjectFieldSection.CONTEXT, 5000, False, "half"),
    (ProjectStandardFieldKey.DEFAULT_ASSIGNEE, BoardProjectFieldSection.CONTEXT, 6000, False, "half"),
    (ProjectStandardFieldKey.TIMEZONE, BoardProjectFieldSection.CONTEXT, 7000, False, "half"),
]


def ensure_board_project_field_layout(board: Board, user=None) -> None:
    """Garante campos de sistema no layout do projeto do board."""
    for field_key, section, sort_order, is_required, form_span in PROJECT_FIELD_DEFAULTS:
        existing = (
            BoardProjectFieldLayout.objects.filter(
                board=board,
                field_source=BoardProjectFieldSource.SYSTEM,
                standard_field_key=field_key,
            )
            .order_by("-created_at")
            .first()
        )
        if existing:
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.is_enabled = True
                existing.save(update_fields=["deleted_at", "is_enabled", "updated_at"])
            continue
        BoardProjectFieldLayout.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            field_source=BoardProjectFieldSource.SYSTEM,
            standard_field_key=field_key,
            section=section,
            sort_order=sort_order,
            is_required=is_required,
            form_span=form_span,
            is_enabled=True,
            created_by=user,
        )


def get_board_project_field_layout(board_id):
    return (
        BoardProjectFieldLayout.objects.filter(
            board_id=board_id, is_enabled=True, deleted_at__isnull=True
        )
        .select_related("custom_field")
        .order_by("sort_order", "standard_field_key", "custom_field__name")
    )


def get_layout_custom_field_ids(board_id) -> set:
    return set(
        BoardProjectFieldLayout.objects.filter(
            board_id=board_id,
            field_source=BoardProjectFieldSource.CUSTOM,
            is_enabled=True,
            deleted_at__isnull=True,
        ).values_list("custom_field_id", flat=True)
    )


def validate_project_custom_values(board_id, values: list[dict]) -> list[str]:
    """Retorna lista de custom_field_ids obrigatórios em falta."""
    if not board_id:
        return []
    required_ids = set(
        BoardProjectFieldLayout.objects.filter(
            board_id=board_id,
            field_source=BoardProjectFieldSource.CUSTOM,
            is_required=True,
            is_enabled=True,
            deleted_at__isnull=True,
        ).values_list("custom_field_id", flat=True)
    )
    provided = {item.get("custom_field_id") for item in values if item.get("value") not in (None, "", [], {})}
    missing = []
    for field_id in required_ids:
        if field_id not in provided:
            # check if value is in values list with non-empty value
            found = False
            for item in values:
                if str(item.get("custom_field_id")) == str(field_id):
                    val = item.get("value")
                    if val not in (None, "", [], {}):
                        found = True
                        break
            if not found:
                missing.append(str(field_id))
    return missing
