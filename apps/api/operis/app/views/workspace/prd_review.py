from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import WorkspaceViewerPermission
from operis.app.views.base import BaseAPIView
from operis.db.models import Workspace
from operis.utils.page_review_metrics import compute_prd_review_metrics, list_prd_review_inbox


class WorkspacePrdReviewInboxEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        status_filter = (request.query_params.get("status") or "").strip() or None
        project_id = (request.query_params.get("project_id") or "").strip() or None
        try:
            limit = min(int(request.query_params.get("limit", 50)), 100)
        except (TypeError, ValueError):
            limit = 50

        items = list_prd_review_inbox(
            workspace,
            request.user,
            status=status_filter,
            project_id=project_id,
            limit=limit,
        )
        return Response({"items": items, "count": len(items)}, status=status.HTTP_200_OK)


class WorkspacePrdReviewMetricsEndpoint(BaseAPIView):
    permission_classes = [WorkspaceViewerPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(compute_prd_review_metrics(workspace, request.user), status=status.HTTP_200_OK)
