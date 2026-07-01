from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.alert import AlertLogSerializer
from operoz.app.views.base import BaseViewSet
from operoz.db.models import AlertLog, Issue
from operoz.utils.paginator import BasePaginator


class AlertLogViewSet(BaseViewSet, BasePaginator):
    model = AlertLog
    serializer_class = AlertLogSerializer

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        queryset = (
            super()
            .get_queryset()
            .filter(workspace__slug=slug, deleted_at__isnull=True)
            .select_related("issue", "issue__project", "receiver")
            .order_by("-created_at")
        )
        alert_type = self.request.query_params.get("alert_type")
        channel = self.request.query_params.get("channel")
        log_status = self.request.query_params.get("status")
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        if channel:
            queryset = queryset.filter(channel=channel)
        if log_status:
            queryset = queryset.filter(status=log_status)
        return queryset

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        return self.paginate(
            request=request,
            queryset=self.get_queryset(),
            on_results=lambda data: AlertLogSerializer(data, many=True).data,
        )


class IssueAlertLogViewSet(BaseViewSet):
    model = AlertLog
    serializer_class = AlertLogSerializer

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug, project_id, iid):
        issue = Issue.objects.get(pk=iid, project_id=project_id, workspace__slug=slug)
        logs = (
            AlertLog.objects.filter(issue=issue, deleted_at__isnull=True)
            .select_related("receiver", "issue", "issue__project")
            .order_by("-created_at")
        )
        return Response(AlertLogSerializer(logs, many=True).data, status=status.HTTP_200_OK)
