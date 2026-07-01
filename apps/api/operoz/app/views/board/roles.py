from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_role import (
    BoardRoleSerializer,
    BoardRoleUpdateSerializer,
    BoardRoleWriteSerializer,
    permission_catalog_payload,
)
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Board, BoardRole, BoardRolePermission
from operoz.utils.board_roles import BOARD_PERMISSION_KEYS_V1, seed_board_roles


class BoardPermissionCatalogEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        return Response(permission_catalog_payload(), status=status.HTTP_200_OK)


class BoardRoleEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return BoardRole.objects.filter(board=board, deleted_at__isnull=True).order_by("sort_order", "name")

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_roles(board, request.user)
        items = self._queryset(board)
        return Response(BoardRoleSerializer(items, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_roles(board, request.user)
        serializer = BoardRoleWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        base_slug = slugify(data["name"])[:48] or "role"
        slug_candidate = base_slug
        n = 1
        while BoardRole.objects.filter(board=board, slug=slug_candidate, deleted_at__isnull=True).exists():
            slug_candidate = f"{base_slug}-{n}"
            n += 1

        max_order = (
            self._queryset(board).order_by("-sort_order").values_list("sort_order", flat=True).first()
        )
        role = BoardRole.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=data["name"],
            description=data.get("description", ""),
            slug=slug_candidate,
            is_system=False,
            sort_order=(max_order or 0) + 1000,
            created_by=request.user,
        )
        perm_map = data.get("permissions") or {}
        for key in BOARD_PERMISSION_KEYS_V1:
            BoardRolePermission.objects.create(
                role=role,
                board=board,
                workspace_id=board.workspace_id,
                permission_key=key,
                granted=bool(perm_map.get(key, False)),
                created_by=request.user,
            )
        return Response(BoardRoleSerializer(role).data, status=status.HTTP_201_CREATED)


class BoardRoleDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _get_role(self, board, pk):
        return BoardRole.objects.get(board=board, pk=pk, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        role = self._get_role(board, pk)
        serializer = BoardRoleUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if "name" in data and not role.is_system:
            role.name = data["name"]
        if "description" in data:
            role.description = data["description"]
        role.save()

        if "permissions" in data:
            perm_map = data["permissions"]
            for key, granted in perm_map.items():
                if key not in BOARD_PERMISSION_KEYS_V1:
                    continue
                perm, _ = BoardRolePermission.objects.get_or_create(
                    role=role,
                    board=board,
                    workspace_id=board.workspace_id,
                    permission_key=key,
                    defaults={"granted": bool(granted), "created_by": request.user},
                )
                if perm.deleted_at is not None:
                    perm.deleted_at = None
                perm.granted = bool(granted)
                perm.save(update_fields=["granted", "deleted_at", "updated_at"])

        return Response(BoardRoleSerializer(role).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        role = self._get_role(board, pk)
        if role.is_system:
            return Response({"error": "SYSTEM_ROLE_CANNOT_DELETE"}, status=status.HTTP_400_BAD_REQUEST)
        role.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardRoleDuplicateEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _get_role(self, board, pk):
        return BoardRole.objects.get(board=board, pk=pk, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        source = self._get_role(board, pk)
        seed_board_roles(board, request.user)

        base_name = f"{source.name} (cópia)"[:250]
        name = base_name
        n = 2
        while BoardRole.objects.filter(board=board, name=name, deleted_at__isnull=True).exists():
            name = f"{base_name} {n}"[:255]
            n += 1

        base_slug = slugify(name)[:48] or "role"
        slug_candidate = base_slug
        idx = 1
        while BoardRole.objects.filter(board=board, slug=slug_candidate, deleted_at__isnull=True).exists():
            slug_candidate = f"{base_slug}-{idx}"
            idx += 1

        max_order = (
            BoardRole.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        role = BoardRole.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=name,
            description=source.description,
            slug=slug_candidate,
            is_system=False,
            sort_order=(max_order or 0) + 1000,
            created_by=request.user,
        )
        source_perms = {
            p.permission_key: p.granted
            for p in BoardRolePermission.objects.filter(role=source, deleted_at__isnull=True)
        }
        for key in BOARD_PERMISSION_KEYS_V1:
            BoardRolePermission.objects.create(
                role=role,
                board=board,
                workspace_id=board.workspace_id,
                permission_key=key,
                granted=bool(source_perms.get(key, False)),
                created_by=request.user,
            )
        return Response(BoardRoleSerializer(role).data, status=status.HTTP_201_CREATED)
