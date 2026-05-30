"""Funções e permissões de board (Tech4Humans BC-4 / 5.4b-v1)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from operis.db.models import BoardMemberRole, BoardRole, BoardRolePermission

if TYPE_CHECKING:
    from operis.db.models import Board

# Chaves 5.4b-v1 (matriz Jira simplificada)
BOARD_PERMISSION_KEYS_V1: list[str] = [
    "board.administer",
    "items.manage",
    "items.watchers.manage",
    "items.attachments.delete_any",
    "items.comments.delete_any",
    "items.delete",
    "items.work",
    "items.assign",
    "items.edit",
    "items.link",
    "items.transition",
    "items.create",
    "items.collaborate",
    "items.attachments.add",
    "items.comments.add",
    "items.attachments.delete_own",
    "items.comments.delete_own",
    "items.comments.edit_own",
    "items.watchers.view",
    "status_reports.manage",
    "status_reports.delete",
]

# Árvore para UI (parent_key None = raiz)
BOARD_PERMISSION_TREE: list[dict] = [
    {
        "key": "board.administer",
        "parent_key": None,
        "children": [],
    },
    {
        "key": "items.manage",
        "parent_key": None,
        "children": [
            "items.watchers.manage",
            "items.attachments.delete_any",
            "items.comments.delete_any",
            "items.delete",
        ],
    },
    {
        "key": "items.work",
        "parent_key": None,
        "children": [
            "items.assign",
            "items.edit",
            "items.link",
            "items.transition",
        ],
    },
    {
        "key": "items.create",
        "parent_key": None,
        "children": [],
    },
    {
        "key": "items.collaborate",
        "parent_key": None,
        "children": [
            "items.attachments.add",
            "items.comments.add",
            "items.attachments.delete_own",
            "items.comments.delete_own",
            "items.comments.edit_own",
            "items.watchers.view",
        ],
    },
    {
        "key": "status_reports.manage",
        "parent_key": None,
        "children": ["status_reports.delete"],
    },
]

SYSTEM_ROLES: list[dict] = [
    {
        "slug": "administrator",
        "name": "Administrador",
        "description": "Acesso total às configurações do board, pessoas, tipos, campos e funções.",
        "sort_order": 1000,
        "permissions": BOARD_PERMISSION_KEYS_V1,
    },
    {
        "slug": "member",
        "name": "Membro",
        "description": "Criar e editar cards, colaborar e transicionar estados.",
        "sort_order": 2000,
        "permissions": [
            "items.work",
            "items.assign",
            "items.edit",
            "items.link",
            "items.transition",
            "items.create",
            "items.collaborate",
            "items.attachments.add",
            "items.comments.add",
            "items.attachments.delete_own",
            "items.comments.delete_own",
            "items.comments.edit_own",
            "items.watchers.view",
            "status_reports.manage",
        ],
    },
    {
        "slug": "observer",
        "name": "Observador",
        "description": "Ver e comentar nos cards.",
        "sort_order": 3000,
        "permissions": [
            "items.collaborate",
            "items.comments.add",
            "items.watchers.view",
        ],
    },
    {
        "slug": "guest_collaborator",
        "name": "Convidado - Colaborador",
        "description": "Acesso limitado a um board; colaboração externa.",
        "sort_order": 4000,
        "permissions": [
            "items.collaborate",
            "items.comments.add",
            "items.watchers.view",
        ],
    },
    {
        "slug": "member_with_delete",
        "name": "Member (Com Delete)",
        "description": "Membro com permissão para apagar cards.",
        "sort_order": 5000,
        "permissions": [
            "items.work",
            "items.assign",
            "items.edit",
            "items.link",
            "items.transition",
            "items.create",
            "items.collaborate",
            "items.attachments.add",
            "items.comments.add",
            "items.attachments.delete_own",
            "items.comments.delete_own",
            "items.comments.edit_own",
            "items.watchers.view",
            "items.delete",
            "status_reports.manage",
            "status_reports.delete",
        ],
    },
]


def _expand_permission_keys(keys: list[str]) -> set[str]:
    """Inclui filhos quando o pai está na lista."""
    expanded = set(keys)
    for node in BOARD_PERMISSION_TREE:
        if node["key"] in expanded:
            expanded.update(node.get("children") or [])
    return expanded


def seed_board_roles(board: Board, user=None) -> None:
    if BoardRole.objects.filter(board=board, deleted_at__isnull=True).exists():
        return

    for spec in SYSTEM_ROLES:
        role = BoardRole.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=spec["name"],
            description=spec["description"],
            slug=spec["slug"],
            is_system=True,
            sort_order=spec["sort_order"],
            created_by=user,
        )
        granted = _expand_permission_keys(spec["permissions"])
        for key in BOARD_PERMISSION_KEYS_V1:
            BoardRolePermission.objects.create(
                role=role,
                board=board,
                workspace_id=board.workspace_id,
                permission_key=key,
                granted=key in granted,
                created_by=user,
            )


def get_user_board_permission_keys(board_id, user_id) -> set[str]:
    if not user_id:
        return set()
    role_ids = BoardMemberRole.objects.filter(
        board_id=board_id, user_id=user_id, deleted_at__isnull=True
    ).values_list("role_id", flat=True)
    if not role_ids:
        return set()
    return set(
        BoardRolePermission.objects.filter(
            role_id__in=role_ids,
            board_id=board_id,
            granted=True,
            deleted_at__isnull=True,
            permission_key__in=BOARD_PERMISSION_KEYS_V1,
        ).values_list("permission_key", flat=True)
    )


def user_has_board_permission(board_id, user_id, permission_key: str) -> bool:
    keys = get_user_board_permission_keys(board_id, user_id)
    if "board.administer" in keys:
        return True
    return permission_key in keys


def user_can_administer_board(board_id, user_id) -> bool:
    return user_has_board_permission(board_id, user_id, "board.administer")
