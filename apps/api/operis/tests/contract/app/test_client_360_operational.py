from __future__ import annotations

from datetime import date

import pytest
from rest_framework import status

from operis.db.models import Module, Project, ProjectMember


@pytest.fixture
def operational_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Operacional",
        identifier="COPR",
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


def _intake_types_url(workspace_slug: str, board_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/boards/{board_slug}/client-360/intake-types/"


def _shared_views_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/shared-views/"


def _detail_url(workspace_slug: str, project_id) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/{project_id}/"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360IntakeTypesAPI:
    def test_list_empty(self, session_client, workspace, workspace_board, setup_instance):
        response = session_client.get(_intake_types_url(workspace.slug, workspace_board.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_create_intake_type(self, session_client, workspace, workspace_board, setup_instance):
        response = session_client.post(
            _intake_types_url(workspace.slug, workspace_board.slug),
            {"name": "Entrada", "type_name_pattern": "intake"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Entrada"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360SharedViewsAPI:
    def test_list_empty(self, session_client, workspace, setup_instance):
        response = session_client.get(_shared_views_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_admin_creates_shared_view(self, session_client, workspace, setup_instance):
        payload = {
            "filter": "all",
            "search": "",
            "boardIds": [],
            "view": "table",
            "sort": {"column": "health", "direction": "asc"},
            "tableColumns": [{"id": "health", "visible": True}],
            "groupByBoard": False,
        }
        response = session_client.post(
            _shared_views_url(workspace.slug),
            {"name": "Vista equipa", "payload": payload, "is_shared": True},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Vista equipa"


@pytest.mark.contract
@pytest.mark.django_db
class TestClient360OperationalDetailAPI:
    def test_detail_includes_operational(self, session_client, workspace, operational_project, setup_instance):
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        response = session_client.get(
            _detail_url(workspace.slug, operational_project.id),
            {"period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "operational" in response.data
        op = response.data["operational"]
        assert "intake" in op
        assert "blockers" in op
        assert "delivery" in op
        assert "raid" in op
        assert "support_sla" in op
