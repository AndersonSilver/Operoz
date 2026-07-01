from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ProjectMemberPermission, ROLE, allow_permission
from operoz.app.serializers import ProjectIssueTypeLiteSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Project
from operoz.utils.board_issue_types import get_project_enabled_issue_types, sync_board_issue_types_to_project


class ProjectIssueTypeEndpoint(BaseAPIView):
    permission_classes = [ProjectMemberPermission]

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id, archived_at__isnull=True)
        sync_board_issue_types_to_project(project, request.user)
        issue_types = get_project_enabled_issue_types(project)
        return Response(
            ProjectIssueTypeLiteSerializer(issue_types, many=True).data,
            status=status.HTTP_200_OK,
        )
