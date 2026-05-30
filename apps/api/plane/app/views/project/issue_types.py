# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ProjectMemberPermission, ROLE, allow_permission
from plane.app.serializers import ProjectIssueTypeLiteSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Project
from plane.utils.board_issue_types import get_project_enabled_issue_types, sync_board_issue_types_to_project


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
