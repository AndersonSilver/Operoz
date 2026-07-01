from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.client_360_operational import (
    BoardClient360IntakeTypeWriteSerializer,
    Client360SharedViewSerializer,
    Client360SharedViewWriteSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardClient360IntakeType, Client360WorkspaceSharedView, Workspace
from operoz.utils.client_360_operational import serialize_intake_type

MAX_SHARED_VIEWS = 50


class BoardClient360IntakeTypesEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)
        rows = BoardClient360IntakeType.objects.filter(
            board=board,
            deleted_at__isnull=True,
        ).order_by("sort_order", "name")
        return Response([serialize_intake_type(row) for row in rows], status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = BoardClient360IntakeTypeWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = BoardClient360IntakeType.objects.create(
            workspace=board.workspace,
            board=board,
            **serializer.validated_data,
        )
        return Response(serialize_intake_type(row), status=status.HTTP_201_CREATED)


class BoardClient360IntakeTypeDetailEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, intake_type_id):
        board = _get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)
        row = BoardClient360IntakeType.objects.filter(
            id=intake_type_id,
            board=board,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response({"error": "Intake type not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = BoardClient360IntakeTypeWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for key, value in serializer.validated_data.items():
            setattr(row, key, value)
        row.save()
        return Response(serialize_intake_type(row), status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, intake_type_id):
        board = _get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)
        row = BoardClient360IntakeType.objects.filter(
            id=intake_type_id,
            board=board,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response({"error": "Intake type not found"}, status=status.HTTP_404_NOT_FOUND)
        row.deleted_at = timezone.now()
        row.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceClient360SharedViewsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        rows = Client360WorkspaceSharedView.objects.filter(
            workspace=workspace,
            is_shared=True,
            deleted_at__isnull=True,
        ).order_by("name")
        return Response(Client360SharedViewSerializer(rows, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        count = Client360WorkspaceSharedView.objects.filter(
            workspace=workspace,
            is_shared=True,
            deleted_at__isnull=True,
        ).count()
        if count >= MAX_SHARED_VIEWS:
            return Response(
                {"error": f"Maximum of {MAX_SHARED_VIEWS} shared views reached."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = Client360SharedViewWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = Client360WorkspaceSharedView.objects.create(
            workspace=workspace,
            name=serializer.validated_data["name"],
            payload=serializer.validated_data["payload"],
            is_shared=serializer.validated_data.get("is_shared", True),
        )
        return Response(Client360SharedViewSerializer(row).data, status=status.HTTP_201_CREATED)


class WorkspaceClient360SharedViewDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, view_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = Client360WorkspaceSharedView.objects.filter(
            id=view_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response({"error": "Shared view not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360SharedViewWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for key, value in serializer.validated_data.items():
            setattr(row, key, value)
        row.save()
        return Response(Client360SharedViewSerializer(row).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, view_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = Client360WorkspaceSharedView.objects.filter(
            id=view_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response({"error": "Shared view not found"}, status=status.HTTP_404_NOT_FOUND)
        row.deleted_at = timezone.now()
        row.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
