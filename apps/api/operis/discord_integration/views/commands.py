from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.views.base import BaseAPIView
from operis.db.models import Workspace
from operis.discord_integration.models import CustomSlashCommand
from operis.discord_integration.serializers import CustomSlashCommandSerializer


def _get_workspace(slug: str) -> Workspace | None:
    return Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()


class WorkspaceDiscordSlashCommandsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = _get_workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        commands = CustomSlashCommand.objects.filter(
            workspace=workspace,
            deleted_at__isnull=True,
        ).order_by("name")
        serializer = CustomSlashCommandSerializer(commands, many=True, context={"workspace": workspace})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = _get_workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomSlashCommandSerializer(
            data=request.data,
            context={"workspace": workspace},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        command = serializer.save(workspace=workspace, created_by=request.user)
        return Response(
            CustomSlashCommandSerializer(command, context={"workspace": workspace}).data,
            status=status.HTTP_201_CREATED,
        )


class WorkspaceDiscordSlashCommandDetailEndpoint(BaseAPIView):
    def _get_command(self, workspace: Workspace, pk) -> CustomSlashCommand | None:
        return CustomSlashCommand.objects.filter(
            pk=pk,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, pk):
        workspace = _get_workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        command = self._get_command(workspace, pk)
        if not command:
            return Response({"error": "Command not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomSlashCommandSerializer(command, context={"workspace": workspace})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        workspace = _get_workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        command = self._get_command(workspace, pk)
        if not command:
            return Response({"error": "Command not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomSlashCommandSerializer(
            command,
            data=request.data,
            partial=True,
            context={"workspace": workspace},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        command = serializer.save(updated_by=request.user)
        return Response(
            CustomSlashCommandSerializer(command, context={"workspace": workspace}).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace = _get_workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        command = self._get_command(workspace, pk)
        if not command:
            return Response({"error": "Command not found"}, status=status.HTTP_404_NOT_FOUND)

        command.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
