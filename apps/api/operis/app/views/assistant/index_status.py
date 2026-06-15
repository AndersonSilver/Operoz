from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.views.base import BaseAPIView
from operis.assistant.index_status import resolve_page_index_status
from operis.assistant.security.access import can_access_page
from operis.assistant.types import AssistantActorContext
from operis.db.models import Page, Workspace


class AssistantPageIndexStatusEndpoint(BaseAPIView):
    """Status de indexação RAG de uma página para o Assistente Operoz."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id, page_id):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "workspace_not_found"}, status=status.HTTP_404_NOT_FOUND)

        page = Page.objects.filter(pk=page_id, workspace_id=workspace.id).first()
        if not page:
            return Response({"error": "page_not_found"}, status=status.HTTP_404_NOT_FOUND)

        ctx = AssistantActorContext(
            user=request.user,
            workspace=workspace,
            project_id=str(project_id),
        )
        if not can_access_page(ctx, page, str(project_id)):
            return Response({"error": "forbidden"}, status=status.HTTP_403_FORBIDDEN)

        return Response(resolve_page_index_status(page))
