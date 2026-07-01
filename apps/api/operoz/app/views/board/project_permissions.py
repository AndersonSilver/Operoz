from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Project
from operoz.utils.board_permission_enforcement import get_effective_board_permission_keys


class ProjectBoardPermissionsEndpoint(BaseAPIView):
    """Permissões efetivas do utilizador atual no board ligado ao projeto (5.4b UI)."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        project = Project.objects.filter(
            workspace__slug=slug,
            pk=project_id,
            deleted_at__isnull=True,
        ).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if not project.board_id:
            return Response(
                {
                    "enforced": False,
                    "permissions": [],
                },
                status=status.HTTP_200_OK,
            )

        keys = get_effective_board_permission_keys(project.board_id, request.user.id)
        if keys is None:
            return Response(
                {
                    "enforced": False,
                    "permissions": [],
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "enforced": True,
                "permissions": sorted(keys),
            },
            status=status.HTTP_200_OK,
        )
