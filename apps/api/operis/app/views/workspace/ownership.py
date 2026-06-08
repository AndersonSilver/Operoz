from django.db import transaction

from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE
from operis.app.serializers import WorkSpaceSerializer
from operis.app.views.base import BaseAPIView
from operis.db.models import Workspace, WorkspaceMember


class WorkspaceTransferOwnershipEndpoint(BaseAPIView):
    def post(self, request, slug):
        new_owner_id = request.data.get("new_owner_id")
        if not new_owner_id:
            return Response({"error": "new_owner_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        if workspace.owner_id != request.user.id:
            return Response(
                {"error": "Only the workspace owner can transfer ownership"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if str(new_owner_id) == str(request.user.id):
            return Response(
                {"error": "You cannot transfer ownership to yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_owner_member = WorkspaceMember.objects.get(
                workspace=workspace,
                member_id=new_owner_id,
                member__is_bot=False,
                is_active=True,
            )
        except WorkspaceMember.DoesNotExist:
            return Response(
                {"error": "The selected user is not an active workspace member"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_owner_member.role < ROLE.MEMBER.value:
            return Response(
                {"error": "Guests cannot become workspace owners"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            workspace.owner_id = new_owner_id
            workspace.save(update_fields=["owner_id", "updated_at"])

            if new_owner_member.role < ROLE.ADMIN.value:
                new_owner_member.role = ROLE.ADMIN.value
                new_owner_member.save(update_fields=["role", "updated_at"])

        serializer = WorkSpaceSerializer(workspace)
        return Response(serializer.data, status=status.HTTP_200_OK)
