from __future__ import annotations

from datetime import date

import pytest
from rest_framework import status

from operoz.db.models import Module, Project, ProjectMember


@pytest.fixture
def narrative_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Narrativa",
        identifier="CNAR",
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
    return project


def _narrative_url(workspace_slug: str, project_id) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/{project_id}/narrative/"


def _reminder_logs_url(workspace_slug: str, board_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/boards/{board_slug}/client-360/reminder-logs/"


def _matrix_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/matrix/"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360NarrativeAPI:
    def test_get_empty_narrative(self, session_client, workspace, narrative_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            _narrative_url(workspace.slug, narrative_project.id),
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["wins_md"] == ""

    def test_patch_narrative(self, session_client, workspace, narrative_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.patch(
            _narrative_url(workspace.slug, narrative_project.id)
            + f"?period_start={period_start.isoformat()}&period_end={period_end.isoformat()}",
            {"wins_md": "Entrega X concluída", "risks_md": "Dependência externa"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "Entrega X" in response.data["wins_md"]


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360ReminderLogsAPI:
    def test_empty_logs(self, session_client, workspace, workspace_board, setup_instance):
        response = session_client.get(_reminder_logs_url(workspace.slug, workspace_board.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360MatrixCsvExportAPI:
    def test_matrix_csv_export(self, session_client, workspace, setup_instance):
        response = session_client.get(_matrix_url(workspace.slug), {"export": "csv", "delimiter": "semicolon"})
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/csv")
        body = response.content.decode("utf-8-sig")
        assert "client" in body.split("\n")[0].lower()
