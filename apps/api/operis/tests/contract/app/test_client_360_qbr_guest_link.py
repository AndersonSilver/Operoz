from __future__ import annotations

from datetime import date, timedelta

import pytest
from django.utils import timezone
from rest_framework import status

from operis.db.models import Client360QbrGuestLink, Project, ProjectMember


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360QbrGuestLinkAPI:
    def test_public_guest_qbr_valid_token(self, api_client, workspace, create_user, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        link = Client360QbrGuestLink.objects.create(
            workspace=workspace,
            scope=Client360QbrGuestLink.SCOPE_PORTFOLIO,
            period_start=period_start,
            period_end=period_end,
            expires_at=timezone.now() + timedelta(days=7),
            created_by=create_user,
        )

        response = api_client.get(f"/api/guest/client-360/qbr/{link.token}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"].startswith("QBR")
        assert "# QBR" in response.data["markdown"]
        assert "<html" in response.data["html"].lower()

    def test_public_guest_qbr_expired(self, api_client, workspace, create_user, setup_instance):
        link = Client360QbrGuestLink.objects.create(
            workspace=workspace,
            scope=Client360QbrGuestLink.SCOPE_PORTFOLIO,
            period_start=date(2026, 6, 9),
            period_end=date(2026, 6, 15),
            expires_at=timezone.now() - timedelta(hours=1),
            created_by=create_user,
        )
        response = api_client.get(f"/api/guest/client-360/qbr/{link.token}/")
        assert response.status_code == status.HTTP_410_GONE

    def test_create_and_revoke_guest_link(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        setup_instance,
    ):
        project = Project.objects.create(
            name="Guest Client",
            identifier="GCLI",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)

        create_response = session_client.post(
            f"/api/workspaces/{workspace.slug}/client-360/qbr-guest-links/",
            {
                "scope": "client",
                "project_id": str(project.id),
                "period_start": "2026-06-09",
                "period_end": "2026-06-15",
                "weeks": 13,
            },
            format="json",
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        assert create_response.data["url"].endswith(create_response.data["token"])
        link_id = create_response.data["id"]

        revoke_response = session_client.delete(
            f"/api/workspaces/{workspace.slug}/client-360/qbr-guest-links/{link_id}/"
        )
        assert revoke_response.status_code == status.HTTP_200_OK
        assert revoke_response.data["revoked_at"] is not None

        public_response = session_client.get(
            f"/api/guest/client-360/qbr/{create_response.data['token']}/"
        )
        assert public_response.status_code == status.HTTP_403_FORBIDDEN
