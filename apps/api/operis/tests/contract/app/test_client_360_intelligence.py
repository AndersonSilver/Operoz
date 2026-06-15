from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from rest_framework import status

from operis.db.models import Client360HealthSnapshot, Module, Project, ProjectMember


@pytest.fixture
def intelligence_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Intel",
        identifier="CINT",
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
    Client360HealthSnapshot.objects.create(
        workspace=workspace,
        project=project,
        period_start=date(2026, 6, 2),
        period_end=date(2026, 6, 8),
        health_score=72,
        health=Client360HealthSnapshot.HEALTH_WARNING,
    )
    return project


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360IntelligenceAPI:
    def test_weekly_briefing_generate(self, session_client, workspace, intelligence_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/client-360/intelligence/weekly-briefing/"
            f"?period_start={period_start.isoformat()}&period_end={period_end.isoformat()}",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "content_md" in response.data
        assert response.data["content_md"]

    def test_health_explainer(self, session_client, workspace, intelligence_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/client-360/{intelligence_project.id}/health-explainer/",
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "explanation_md" in response.data

    def test_suggested_actions(self, session_client, workspace, intelligence_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/client-360/{intelligence_project.id}/suggested-actions/",
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "actions" in response.data

    def test_qbr_draft_generate(self, session_client, workspace, intelligence_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.post(
            f"/api/workspaces/{workspace.slug}/client-360/{intelligence_project.id}/qbr-draft/"
            f"?period_start={period_start.isoformat()}&period_end={period_end.isoformat()}&quarter=2026-Q2",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "content_md" in response.data

    def test_scenario_playbooks(self, session_client, workspace, setup_instance):
        response = session_client.get(
            f"/api/workspaces/{workspace.slug}/client-360/intelligence/scenario-playbooks/",
            {"scenarios": "report_missing,health_critical"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["playbooks"]) >= 1
