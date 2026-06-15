from __future__ import annotations

import pytest
from rest_framework import status

from operis.db.models import Client360HealthSnapshot, Project, ProjectMember
from operis.utils.client_360_health_history import (
    HEALTH_HISTORY_SCHEMA_VERSION,
    recent_week_periods,
    upsert_health_snapshot,
)


@pytest.fixture
def client_360_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Histórico",
        identifier="CHIST",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    return project


def _health_history_url(workspace_slug: str, project_id) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/{project_id}/health-history/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceClient360HealthHistoryAPI:
    EXPECTED_TOP_KEYS = {
        "schema_version",
        "project_id",
        "weeks_requested",
        "source",
        "limitation",
        "history",
    }
    EXPECTED_ITEM_KEYS = {
        "period_start",
        "period_end",
        "health_score",
        "health",
        "source",
    }

    def test_empty_history_for_new_project(
        self, session_client, workspace, client_360_project, setup_instance
    ):
        response = session_client.get(_health_history_url(workspace.slug, client_360_project.id))
        assert response.status_code == status.HTTP_200_OK
        assert set(response.data.keys()) == self.EXPECTED_TOP_KEYS
        assert response.data["schema_version"] == HEALTH_HISTORY_SCHEMA_VERSION
        assert response.data["weeks_requested"] == 8
        assert response.data["project_id"] == str(client_360_project.id)
        assert isinstance(response.data["history"], list)
        assert len(response.data["history"]) <= 1

    def test_eight_snapshots_ordered(self, session_client, workspace, client_360_project, setup_instance):
        for index, period in enumerate(recent_week_periods(8)):
            upsert_health_snapshot(
                project=client_360_project,
                period=period,
                health_score=60 + index,
                health=Client360HealthSnapshot.HEALTH_OK,
            )

        response = session_client.get(
            _health_history_url(workspace.slug, client_360_project.id),
            {"weeks": 8},
        )
        assert response.status_code == status.HTTP_200_OK
        history = response.data["history"]
        snapshot_rows = [row for row in history if row["source"] == "snapshot"]
        assert len(snapshot_rows) == 8
        starts = [row["period_start"] for row in history]
        assert starts == sorted(starts)
        for item in history:
            assert set(item.keys()) == self.EXPECTED_ITEM_KEYS

    def test_invalid_weeks_param(self, session_client, workspace, client_360_project, setup_instance):
        response = session_client.get(
            _health_history_url(workspace.slug, client_360_project.id),
            {"weeks": 0},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_project_not_found(self, session_client, workspace, setup_instance):
        import uuid

        response = session_client.get(_health_history_url(workspace.slug, uuid.uuid4()))
        assert response.status_code == status.HTTP_404_NOT_FOUND
