# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import Board, BoardIssueType, IssueType, Project, ProjectIssueType

# Alinhado ao Jira (Fase 2 — tech4humans-board-config-mvp3-plano.md §2.1)
# Ícones Material Symbols (mesmo formato do EmojiPicker iconType="material").
DEFAULT_BOARD_ISSUE_TYPE_SEED = [
    ("Backlog", "filter_list", "#5e6ad2"),
    ("Deploy", "rocket", "#e57a00"),
    ("Desenvolvimento", "terminal", "#5e6ad2"),
    ("Homologação externa", "public", "#02b5ed"),
    ("Homologação interna", "apps", "#6d7b8a"),
    ("Imersão", "assistant_navigation", "#02b55c"),
    ("Kickoff", "start", "#f2be02"),
    ("Operação assistida", "settings_accessibility", "#5e6ad2"),
    ("Sustentação", "settings", "#95999f"),
    ("Tarefa", "check_box", "#02b55c"),
]


def _material_logo(name: str, color: str) -> dict:
    return {"in_use": "icon", "icon": {"name": name, "color": color}}


DEFAULT_ISSUE_TYPE_ICON_BY_NAME = {
    name: _material_logo(icon, color) for name, icon, color in DEFAULT_BOARD_ISSUE_TYPE_SEED
}


def ensure_default_issue_type_icons(board: Board) -> int:
    """Corrige tipos do catálogo que ainda usam emoji (não renderizam no picker material)."""
    updated = 0
    for bit in BoardIssueType.objects.filter(board=board, deleted_at__isnull=True).select_related(
        "issue_type"
    ):
        issue_type = bit.issue_type
        expected = DEFAULT_ISSUE_TYPE_ICON_BY_NAME.get(issue_type.name)
        if not expected:
            continue
        current = issue_type.logo_props or {}
        icon = current.get("icon") or {}
        needs_update = current.get("in_use") != "icon" or not icon.get("name")
        if needs_update:
            issue_type.logo_props = expected
            issue_type.save(update_fields=["logo_props", "updated_at"])
            updated += 1
    return updated


def seed_board_issue_types(board: Board, user=None) -> int:
    """Cria tipos default no workspace e liga ao board. Idempotente se o board já tiver tipos."""
    if BoardIssueType.objects.filter(board=board, deleted_at__isnull=True).exists():
        return 0

    created = 0
    default_name = "Tarefa"
    for idx, (name, icon_name, icon_color) in enumerate(DEFAULT_BOARD_ISSUE_TYPE_SEED):
        issue_type, _ = IssueType.objects.get_or_create(
            workspace_id=board.workspace_id,
            name=name,
            defaults={
                "logo_props": _material_logo(icon_name, icon_color),
                "is_active": True,
                "is_epic": False,
                "level": float(idx),
                "is_default": name == default_name,
            },
        )
        if not issue_type.is_active:
            issue_type.is_active = True
            issue_type.save(update_fields=["is_active", "updated_at"])

        _, was_created = BoardIssueType.objects.get_or_create(
            board=board,
            issue_type=issue_type,
            workspace_id=board.workspace_id,
            defaults={
                "sort_order": float(idx * 1000),
                "is_enabled": True,
            },
        )
        if was_created:
            created += 1

    return created


def sync_board_issue_types_to_project(project: Project, user=None) -> None:
    """Copia tipos ativos do board para ProjectIssueType e activa is_issue_type_enabled."""
    if not project.board_id:
        return

    board_types = (
        BoardIssueType.objects.filter(
            board_id=project.board_id,
            is_enabled=True,
            deleted_at__isnull=True,
            issue_type__is_active=True,
            issue_type__deleted_at__isnull=True,
        )
        .select_related("issue_type")
        .order_by("sort_order", "issue_type__name")
    )

    if not board_types.exists():
        return

    if not project.is_issue_type_enabled:
        project.is_issue_type_enabled = True
        project.save(update_fields=["is_issue_type_enabled", "updated_at"])

    has_default = ProjectIssueType.objects.filter(
        project=project, is_default=True, deleted_at__isnull=True
    ).exists()

    for idx, board_type in enumerate(board_types):
        defaults = {
            "level": idx,
            "is_default": not has_default and idx == 0,
        }
        pit, created = ProjectIssueType.objects.get_or_create(
            project=project,
            issue_type=board_type.issue_type,
            workspace_id=project.workspace_id,
            defaults=defaults,
        )
        if created and pit.is_default:
            has_default = True


def sync_board_issue_types_to_all_board_projects(board: Board, user=None) -> None:
    """Propaga tipos activos do board a todos os projetos ligados."""
    projects = Project.objects.filter(board_id=board.id, archived_at__isnull=True, deleted_at__isnull=True)
    for project in projects:
        sync_board_issue_types_to_project(project, user)


def get_project_enabled_issue_types(project: Project):
    """Tipos disponíveis ao criar card: ProjectIssueType ∩ board.is_enabled."""
    if not project.board_id:
        return IssueType.objects.none()

    return (
        IssueType.objects.filter(
            project_issue_types__project_id=project.id,
            project_issue_types__deleted_at__isnull=True,
            board_issue_types__board_id=project.board_id,
            board_issue_types__is_enabled=True,
            board_issue_types__deleted_at__isnull=True,
            is_active=True,
            deleted_at__isnull=True,
        )
        .distinct()
        .order_by("board_issue_types__sort_order", "name")
    )
