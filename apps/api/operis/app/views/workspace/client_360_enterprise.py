from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.serializers.client_360_enterprise import (
    Client360CustomerAssignSerializer,
    Client360CustomerWriteSerializer,
    Client360WebhookSubscriptionWriteSerializer,
    WorkspaceClient360EnterpriseSettingsWriteSerializer,
)
from operis.app.views.base import BaseAPIView
from operis.app.views.workspace.client_360 import WorkspaceClient360ViewSet
from operis.db.models import (
    Client360AuditEntry,
    Client360Customer,
    Client360WebhookDeliveryLog,
    Client360WebhookSubscription,
    Project,
    Workspace,
    WorkspaceClient360EnterpriseSettings,
)
from operis.utils.client_360_enterprise import (
    build_bi_csv_content,
    build_bi_fact_rows,
    build_instance_rollup,
    dispatch_client360_webhook,
    load_enterprise_settings,
    purge_retention_data,
    record_client360_audit,
    run_crm_sync,
    serialize_customer,
)


class WorkspaceClient360EnterpriseSettingsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(load_enterprise_settings(workspace.id), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row, _ = WorkspaceClient360EnterpriseSettings.objects.get_or_create(workspace=workspace)
        serializer = WorkspaceClient360EnterpriseSettingsWriteSerializer(row, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = serializer.save()
        record_client360_audit(
            workspace_id=workspace.id,
            entity_type="enterprise_settings",
            entity_id=str(row.id),
            action="update",
            actor_id=request.user.id,
            snapshot=load_enterprise_settings(workspace.id),
        )
        return Response(load_enterprise_settings(workspace.id), status=status.HTTP_200_OK)


class WorkspaceClient360CustomersEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        rows = Client360Customer.objects.filter(workspace=workspace, deleted_at__isnull=True).order_by("name")
        return Response({"customers": [serialize_customer(row) for row in rows]}, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360CustomerWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = Client360Customer.objects.create(workspace=workspace, **serializer.validated_data)
        return Response(serialize_customer(row), status=status.HTTP_201_CREATED)


class WorkspaceClient360CustomerDetailEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, customer_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = Client360Customer.objects.filter(id=customer_id, workspace=workspace, deleted_at__isnull=True).first()
        if not row:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360CustomerWriteSerializer(row, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = serializer.save()
        return Response(serialize_customer(row), status=status.HTTP_200_OK)


class WorkspaceClient360ProjectCustomerAssignEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, project_id):
        self.view_set.request = request
        project = self.view_set._accessible_projects(slug).filter(id=project_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360CustomerAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        customer_id = serializer.validated_data.get("customer_id")
        if customer_id:
            customer = Client360Customer.objects.filter(
                id=customer_id,
                workspace=project.workspace,
                deleted_at__isnull=True,
            ).first()
            if not customer:
                return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
            project.client360_customer = customer
        else:
            project.client360_customer = None
        project.save(update_fields=["client360_customer", "updated_at"])
        return Response({"project_id": str(project.id), "customer_id": str(customer_id) if customer_id else None})


class WorkspaceClient360WebhooksEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        rows = Client360WebhookSubscription.objects.filter(workspace=workspace, deleted_at__isnull=True)
        payload = [
            {
                "id": str(row.id),
                "url": row.url,
                "event_types": row.event_types,
                "is_active": row.is_active,
            }
            for row in rows
        ]
        return Response({"subscriptions": payload}, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360WebhookSubscriptionWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row = Client360WebhookSubscription.objects.create(workspace=workspace, **serializer.validated_data)
        return Response({"id": str(row.id), "secret": row.secret}, status=status.HTTP_201_CREATED)


class WorkspaceClient360WebhookTestEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, subscription_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        sub = Client360WebhookSubscription.objects.filter(
            id=subscription_id,
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not sub:
            return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)
        results = dispatch_client360_webhook(
            workspace.id,
            "health_change",
            {"test": True, "workspace_slug": slug},
        )
        return Response({"results": results}, status=status.HTTP_200_OK)


class WorkspaceClient360AuditLogEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        entity_type = request.query_params.get("entity_type")
        qs = Client360AuditEntry.objects.filter(workspace=workspace, deleted_at__isnull=True).order_by("-created_at")[:100]
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        payload = [
            {
                "id": str(row.id),
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "action": row.action,
                "actor_id": str(row.actor_id) if row.actor_id else None,
                "snapshot": row.snapshot,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in qs
        ]
        return Response({"entries": payload}, status=status.HTTP_200_OK)


class WorkspaceClient360AuditExportEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        rows = Client360AuditEntry.objects.filter(workspace=workspace, deleted_at__isnull=True).order_by("-created_at")[:500]
        import csv
        import io

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["created_at", "entity_type", "entity_id", "action", "actor_id"])
        for row in rows:
            writer.writerow(
                [
                    row.created_at.isoformat() if row.created_at else "",
                    row.entity_type,
                    row.entity_id,
                    row.action,
                    str(row.actor_id) if row.actor_id else "",
                ]
            )
        response = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="client360-audit-{slug}.csv"'
        return response


class WorkspaceClient360BiExportEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        settings = load_enterprise_settings(
            Workspace.objects.filter(slug=slug, deleted_at__isnull=True).values_list("id", flat=True).first()
        )
        if not settings.get("bi_export_enabled", True):
            return Response({"error": "bi_export_disabled"}, status=status.HTTP_404_NOT_FOUND)
        self.view_set.request = request
        list_response = self.view_set.list(request, slug=slug)
        if list_response.status_code != status.HTTP_200_OK:
            return list_response
        clients = list_response.data.get("clients") or []
        rows = build_bi_fact_rows(clients, workspace_slug=slug)
        if (request.query_params.get("format") or "").lower() == "json":
            return Response({"rows": rows, "schema_version": 1}, status=status.HTTP_200_OK)
        content = build_bi_csv_content(rows)
        response = HttpResponse(content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="client360-bi-{slug}.csv"'
        return response


class WorkspaceClient360CrmSyncEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        result = run_crm_sync(workspace.id)
        status_code = status.HTTP_200_OK if result.get("ok") else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)


class WorkspaceClient360RetentionPurgeEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        settings = load_enterprise_settings(workspace.id)
        result = purge_retention_data(workspace.id, settings.get("retention_weeks", 52))
        return Response(result, status=status.HTTP_200_OK)


class InstanceClient360RollupEndpoint(BaseAPIView):
    def get(self, request):
        if not getattr(request.user, "is_superuser", False):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        workspaces = list(Workspace.objects.filter(deleted_at__isnull=True).order_by("name")[:50])
        return Response(build_instance_rollup(workspaces), status=status.HTTP_200_OK)
