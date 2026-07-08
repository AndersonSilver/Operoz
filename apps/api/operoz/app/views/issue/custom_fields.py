from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers import IssueCustomFieldValueSerializer, IssueCustomFieldValuesBulkSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Issue, IssueCustomFieldValue
from operoz.utils.board_custom_fields import get_project_enabled_custom_fields
from operoz.utils.board_permission_enforcement import deny_board_permission


class IssueCustomFieldValueEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, issue_id):
        issue = Issue.objects.get(workspace__slug=slug, pk=issue_id, deleted_at__isnull=True)
        allowed_ids = set(get_project_enabled_custom_fields(issue.project).values_list("id", flat=True))
        values = IssueCustomFieldValue.objects.filter(
            issue=issue, deleted_at__isnull=True, custom_field_id__in=allowed_ids
        ).select_related("custom_field")
        return Response(
            IssueCustomFieldValueSerializer(values, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def put(self, request, slug, issue_id):
        issue = Issue.objects.select_related("project", "project__board").get(
            workspace__slug=slug, pk=issue_id, deleted_at__isnull=True
        )
        if denied := deny_board_permission(request.user, issue.project, "items.edit"):
            return denied
        serializer = IssueCustomFieldValuesBulkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        allowed_ids = set(get_project_enabled_custom_fields(issue.project).values_list("id", flat=True))
        saved = []

        for item in serializer.validated_data["values"]:
            field_id = item["custom_field_id"]
            if field_id not in allowed_ids:
                continue
            value_obj, created = IssueCustomFieldValue.objects.update_or_create(
                issue=issue,
                custom_field_id=field_id,
                defaults={
                    "value": item.get("value") or {},
                    "workspace_id": issue.workspace_id,
                    "project": issue.project,
                    "updated_by": request.user,
                },
            )
            if created:
                value_obj.created_by = request.user
                value_obj.save(update_fields=["created_by", "updated_at"])
            saved.append(value_obj)

        values = IssueCustomFieldValue.objects.filter(
            issue=issue, pk__in=[v.pk for v in saved], deleted_at__isnull=True
        ).select_related("custom_field")
        return Response(
            IssueCustomFieldValueSerializer(values, many=True).data,
            status=status.HTTP_200_OK,
        )
