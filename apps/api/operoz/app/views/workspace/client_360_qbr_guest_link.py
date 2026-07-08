from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.views.base import BaseViewSet
from operoz.db.models import Client360QbrGuestLink, Project, Workspace
from operoz.utils.client_360_qbr_export import parse_qbr_weeks
from operoz.utils.client_360_qbr_guest_link import (
    create_guest_link,
    parse_guest_link_period,
    parse_guest_link_ttl_days,
    serialize_guest_link,
)


class WorkspaceClient360QbrGuestLinkViewSet(BaseViewSet):
    """Create, list and revoke tokenized guest QBR links."""

    use_read_replica = True

    def _workspace(self, slug: str):
        return Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()

    def _accessible_projects(self, slug: str):
        return (
            Project.objects.filter(
                workspace__slug=slug,
                archived_at__isnull=True,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .select_related("board", "project_lead")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def list(self, request, slug):
        workspace = self._workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        links = Client360QbrGuestLink.objects.filter(workspace=workspace).order_by("-created_at")[:50]
        return Response([serialize_guest_link(link) for link in links], status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = self._workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        scope = (request.data.get("scope") or Client360QbrGuestLink.SCOPE_CLIENT).strip()
        if scope not in {Client360QbrGuestLink.SCOPE_CLIENT, Client360QbrGuestLink.SCOPE_PORTFOLIO}:
            return Response({"error": "scope must be client or portfolio"}, status=status.HTTP_400_BAD_REQUEST)

        period, period_err = parse_guest_link_period(
            request.data.get("period_start"),
            request.data.get("period_end"),
        )
        if period_err:
            return Response({"error": period_err}, status=status.HTTP_400_BAD_REQUEST)

        weeks, weeks_err = parse_qbr_weeks(
            str(request.data.get("weeks")) if request.data.get("weeks") is not None else None
        )
        if weeks_err:
            return Response({"error": weeks_err}, status=status.HTTP_400_BAD_REQUEST)

        ttl_days, ttl_err = parse_guest_link_ttl_days(request.data.get("expires_in_days"))
        if ttl_err:
            return Response({"error": ttl_err}, status=status.HTTP_400_BAD_REQUEST)

        include_compare = bool(request.data.get("include_compare"))
        projects = list(self._accessible_projects(slug))
        project = None

        if scope == Client360QbrGuestLink.SCOPE_CLIENT:
            project_id = request.data.get("project_id")
            project = self._accessible_projects(slug).filter(id=project_id).first()
            if not project:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        elif not projects:
            return Response({"error": "No accessible projects for portfolio link"}, status=status.HTTP_400_BAD_REQUEST)

        link = create_guest_link(
            workspace=workspace,
            user=request.user,
            scope=scope,
            period=period,
            weeks=weeks,
            include_compare=include_compare,
            expires_in_days=ttl_days,
            project=project,
            accessible_projects=projects,
        )
        return Response(serialize_guest_link(link), status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        workspace = self._workspace(slug)
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        link = Client360QbrGuestLink.objects.filter(workspace=workspace, pk=pk).first()
        if not link:
            return Response({"error": "Link not found"}, status=status.HTTP_404_NOT_FOUND)

        if link.revoked_at:
            return Response(serialize_guest_link(link), status=status.HTTP_200_OK)

        link.revoked_at = timezone.now()
        link.save(update_fields=["revoked_at", "updated_at"])
        return Response(serialize_guest_link(link), status=status.HTTP_200_OK)
