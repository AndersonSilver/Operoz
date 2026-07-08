from operoz.db.models import Board, BoardStandardField, StandardFieldKey

# Ordem padrão no formulário do card (abaixo do responsável).
STANDARD_FIELD_DEFAULTS: list[tuple[str, float]] = [
    (StandardFieldKey.PRIORITY, 1000),
    (StandardFieldKey.LABEL_IDS, 2000),
    (StandardFieldKey.START_DATE, 3000),
    (StandardFieldKey.TARGET_DATE, 4000),
    (StandardFieldKey.CYCLE_ID, 5000),
    (StandardFieldKey.MODULE_IDS, 6000),
    (StandardFieldKey.ESTIMATE_POINT, 6500),
    (StandardFieldKey.PARENT_ID, 7000),
]


def ensure_board_standard_fields(board: Board, user=None) -> None:
    """Garante os campos padrão do card no board (não apagáveis do workspace)."""
    for field_key, sort_order in STANDARD_FIELD_DEFAULTS:
        existing = BoardStandardField.objects.filter(board=board, field_key=field_key).order_by("-created_at").first()
        if existing:
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.is_enabled = True
                existing.save(update_fields=["deleted_at", "is_enabled", "updated_at"])
            continue
        BoardStandardField.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            field_key=field_key,
            sort_order=sort_order,
            is_enabled=True,
            created_by=user,
        )


def get_enabled_standard_field_keys(board_id) -> list[str]:
    return list(
        BoardStandardField.objects.filter(
            board_id=board_id,
            is_enabled=True,
            deleted_at__isnull=True,
        )
        .order_by("sort_order", "field_key")
        .values_list("field_key", flat=True)
    )
