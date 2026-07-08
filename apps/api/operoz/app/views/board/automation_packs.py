from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_automation_pack import BoardAutomationPackInstallSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.automation.catalog import catalog_for_board
from operoz.automation.packs_lifecycle import install_automation_pack, uninstall_automation_pack
from operoz.automation.packs_registry import get_automation_pack, list_automation_packs
from operoz.db.models import BoardAutomationPackInstall


class BoardAutomationPackListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        available = list_automation_packs()
        installed = BoardAutomationPackInstall.objects.filter(
            board=board,
            deleted_at__isnull=True,
        ).order_by("-installed_at")
        return Response(
            {
                "available": available,
                "installed": BoardAutomationPackInstallSerializer(installed, many=True).data,
                "catalog": catalog_for_board(str(board.id)).to_api_list(),
            },
            status=status.HTTP_200_OK,
        )


class BoardAutomationPackInstallEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, pack_name):
        board = _get_board(slug, board_slug)
        if not get_automation_pack(pack_name):
            return Response({"error": "Pack não encontrado.", "code": "not_found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            install = install_automation_pack(
                board,
                pack_name,
                config=request.data.get("config") or {},
                actor=request.user,
                create_rules=bool(request.data.get("create_rules", True)),
                publish_rules=bool(request.data.get("publish", False)),
            )
        except ValueError as exc:
            code = str(exc)
            if code == "pack_already_installed":
                return Response(
                    {"error": "Pack já instalado neste board.", "code": code}, status=status.HTTP_409_CONFLICT
                )
            if code.startswith("template_not_found:"):
                return Response({"error": code, "code": "template_not_found"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": code, "code": "install_failed"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            BoardAutomationPackInstallSerializer(install).data,
            status=status.HTTP_201_CREATED,
        )


class BoardAutomationPackUninstallEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, pack_name):
        board = _get_board(slug, board_slug)
        try:
            uninstall_automation_pack(board, pack_name)
        except ValueError as exc:
            if str(exc) == "pack_not_installed":
                return Response({"error": "Pack não instalado.", "code": str(exc)}, status=status.HTTP_404_NOT_FOUND)
            return Response({"error": str(exc), "code": "uninstall_failed"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"ok": True, "pack_name": pack_name}, status=status.HTTP_200_OK)
