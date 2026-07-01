from typing import Optional

from operoz.db.models import Board, Project


def resolve_analytics_project_ids(
    slug: str,
    project_ids: Optional[str],
    board_id: Optional[str],
) -> Optional[str]:
    """
    Resolve project_ids query param for analytics.

    - Explicit project_ids in the request take precedence.
    - board_id resolves to all non-archived projects in that board (same workspace).
    - Returns empty string when the board has no projects (filters to zero rows).
    - Returns None when no project/board filter is applied.
    """
    if project_ids:
        return project_ids

    if not board_id:
        return None

    board_exists = Board.objects.filter(
        pk=board_id,
        workspace__slug=slug,
        deleted_at__isnull=True,
    ).exists()

    if not board_exists:
        return ""

    ids = Project.objects.filter(
        board_id=board_id,
        workspace__slug=slug,
        deleted_at__isnull=True,
        archived_at__isnull=True,
    ).values_list("id", flat=True)

    return ",".join(str(project_id) for project_id in ids) if ids else ""
