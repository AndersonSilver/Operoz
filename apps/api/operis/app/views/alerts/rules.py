from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.serializers.alert import AlertRuleSerializer
from operis.app.views.base import BaseViewSet
from operis.db.models import AlertRule, Workspace


class AlertRuleViewSet(BaseViewSet):
    model = AlertRule
    serializer_class = AlertRuleSerializer

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=slug, deleted_at__isnull=True)
            .select_related("workspace", "project")
            .order_by("alert_type", "created_at")
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        queryset = self.get_queryset()
        project_id = request.query_params.get("project")
        if project_id:
            queryset = queryset.filter(Q(project_id=project_id) | Q(project__isnull=True))
        serializer = AlertRuleSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = AlertRuleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        rule = serializer.save(workspace=workspace)
        return Response(AlertRuleSerializer(rule).data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        rule = self.get_queryset().get(pk=pk)
        return Response(AlertRuleSerializer(rule).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        rule = self.get_queryset().get(pk=pk)
        serializer = AlertRuleSerializer(rule, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        rule = serializer.save()
        return Response(AlertRuleSerializer(rule).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        rule = self.get_queryset().get(pk=pk)
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
