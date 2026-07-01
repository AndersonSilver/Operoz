from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from rest_framework import status

from operoz.db.models import Client360ProjectFinopsProfile, Module, Project, ProjectMember


@pytest.fixture
def finops_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente FinOps",
        identifier="CFIN",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    Module.objects.create(
        name="Módulo",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    Client360ProjectFinopsProfile.objects.create(
        workspace=workspace,
        project=project,
        period_month=date(2026, 6, 1),
        hours_allocated=Decimal("160"),
        capacity_hours=Decimal("200"),
        budget_planned=Decimal("100000"),
        budget_actual=Decimal("120000"),
        revenue_contract=Decimal("150000"),
        harness_cost_mtd=Decimal("35000"),
    )
    return project


def _list_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/"


def _detail_url(workspace_slug: str, project_id) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/{project_id}/"


def _finops_settings_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/finops/settings/"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360FinopsAPI:
    def test_list_includes_finops_summary(self, session_client, workspace, finops_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            _list_url(workspace.slug),
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "finops_summary" in response.data
        client = next(c for c in response.data["clients"] if c["project_id"] == str(finops_project.id))
        assert client["finops"]["utilization"]["pct"] == 80.0
        assert client["finops"]["margin_pct"] is not None

    def test_detail_includes_finops(self, session_client, workspace, finops_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            _detail_url(workspace.slug, finops_project.id),
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "finops" in response.data
        assert response.data["finops"]["burn_rate"] >= 0

    def test_finops_settings_defaults(self, session_client, workspace, setup_instance):
        response = session_client.get(_finops_settings_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["variance_alert_pct"] == 10

    def test_finops_export_csv(self, session_client, workspace, finops_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/client-360/finops/export/",
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response["Content-Type"]
        assert b"client_name" in response.content
