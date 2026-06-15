from __future__ import annotations

from datetime import date
from unittest.mock import patch

import pytest
from rest_framework import status

from operis.db.models import (
    Client360Customer,
    Client360WebhookSubscription,
    Module,
    Project,
    ProjectMember,
    WorkspaceClient360EnterpriseSettings,
)


@pytest.fixture
def enterprise_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Enterprise Client",
        identifier="ENTC",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    Module.objects.create(name="Módulo", project=project, workspace=workspace, created_by=create_user)
    return project


def _settings_url(slug: str) -> str:
    return f"/api/workspaces/{slug}/client-360/enterprise/settings/"


def _customers_url(slug: str) -> str:
    return f"/api/workspaces/{slug}/client-360/enterprise/customers/"


def _list_url(slug: str) -> str:
    return f"/api/workspaces/{slug}/client-360/"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360EnterpriseAPI:
    def test_list_includes_enterprise_payload(self, session_client, workspace, enterprise_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            _list_url(workspace.slug),
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert "enterprise" in response.data
        assert response.data["enterprise"]["phase_flags"]["6"] is True

    def test_enterprise_settings_patch(self, session_client, workspace, setup_instance):
        response = session_client.patch(
            _settings_url(workspace.slug),
            {
                "phase_flags": {"5": False},
                "list_grouping_mode": WorkspaceClient360EnterpriseSettings.GROUPING_CUSTOMER,
                "retention_weeks": 26,
                "data_region": "BR",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["phase_flags"]["5"] is False
        assert response.data["list_grouping_mode"] == "customer"
        assert response.data["retention_weeks"] == 26

    def test_customers_crud_and_assign(self, session_client, workspace, enterprise_project, setup_instance):
        create = session_client.post(
            _customers_url(workspace.slug),
            {"name": "Acme", "external_crm_id": "ext-1", "segment": "enterprise"},
            format="json",
        )
        assert create.status_code == status.HTTP_201_CREATED
        customer_id = create.data["id"]

        assign = session_client.patch(
            f"/api/workspaces/{workspace.slug}/client-360/{enterprise_project.id}/customer/",
            {"customer_id": customer_id},
            format="json",
        )
        assert assign.status_code == status.HTTP_200_OK
        assert assign.data["customer_id"] == customer_id

        listing = session_client.get(_customers_url(workspace.slug))
        assert listing.status_code == status.HTTP_200_OK
        assert len(listing.data["customers"]) == 1

    def test_webhook_subscription_and_test(self, session_client, workspace, setup_instance):
        create = session_client.post(
            f"/api/workspaces/{workspace.slug}/client-360/enterprise/webhooks/",
            {"url": "https://example.com/hook", "event_types": ["health_score_alert"]},
            format="json",
        )
        assert create.status_code == status.HTTP_201_CREATED
        sub_id = create.data["id"]
        with patch("operis.utils.client_360_enterprise.requests.post") as mock_post:
            mock_post.return_value.ok = True
            mock_post.return_value.status_code = 200
            test = session_client.post(
                f"/api/workspaces/{workspace.slug}/client-360/enterprise/webhooks/{sub_id}/test/",
            )
        assert test.status_code == status.HTTP_200_OK
        assert Client360WebhookSubscription.objects.filter(id=sub_id).exists()

    def test_bi_export_json(self, session_client, workspace, enterprise_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/client-360/enterprise/bi-export/",
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat(), "format": "json"},
        )
        assert response.status_code == status.HTTP_200_OK, response.data
        assert "rows" in response.data
        assert len(response.data["rows"]) >= 1

    def test_crm_sync_requires_enabled(self, session_client, workspace, setup_instance):
        response = session_client.post(f"/api/workspaces/{workspace.slug}/client-360/enterprise/crm-sync/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_crm_sync_ok(self, session_client, workspace, setup_instance):
        Client360Customer.objects.create(workspace=workspace, name="Synced", external_crm_id="x1")
        settings, _ = WorkspaceClient360EnterpriseSettings.objects.get_or_create(workspace=workspace)
        settings.crm_enabled = True
        settings.crm_config = {"accounts": {"x1": {"revenue": "1000"}}}
        settings.save()
        response = session_client.post(f"/api/workspaces/{workspace.slug}/client-360/enterprise/crm-sync/")
        assert response.status_code == status.HTTP_200_OK, response.data
        assert response.data["ok"] is True

    def test_instance_rollup_forbidden_for_member(self, session_client, setup_instance):
        response = session_client.get("/api/instances/client-360-rollup/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_portfolio_clients(self, api_client, workspace, create_user, setup_instance):
        from datetime import timedelta

        from django.utils import timezone

        from operis.db.models import Client360QbrGuestLink

        link = Client360QbrGuestLink.objects.create(
            workspace=workspace,
            scope=Client360QbrGuestLink.SCOPE_PORTFOLIO,
            period_start=date(2026, 6, 9),
            period_end=date(2026, 6, 15),
            expires_at=timezone.now() + timedelta(days=7),
            created_by=create_user,
        )
        response = api_client.get(f"/api/guest/client-360/portal/{link.token}/clients/")
        assert response.status_code == status.HTTP_200_OK, response.data
        assert "clients" in response.data
        assert "auth" in response.data
