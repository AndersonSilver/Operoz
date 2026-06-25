from operis.db.models import BoardModuleStage
from operis.utils.status_report_export import DEFAULT_ETAPAS


def seed_board_module_stages(board, user) -> list[BoardModuleStage]:
    """Cria etapas padrão Operoz a partir de DEFAULT_ETAPAS se o board ainda não tiver nenhuma."""
    existing = BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True).exists()
    if existing:
        return list(
            BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True).order_by("sort_order", "created_at")
        )

    created: list[BoardModuleStage] = []
    for index, name in enumerate(DEFAULT_ETAPAS):
        stage = BoardModuleStage.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=name,
            color="#00b8a9",
            sort_order=(index + 1) * 1000,
            is_default=index == 0,
            is_active=True,
            created_by=user,
        )
        created.append(stage)
    return created
