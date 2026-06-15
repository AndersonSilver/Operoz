from __future__ import annotations

from datetime import date

import pytest
from django.utils import timezone
from rest_framework import status

from operis.db.models import BoardStatusReport, Module, Project, ProjectMember
from operis.utils.client_360 import WeekPeriod
from operis.utils.client_360_matrix import CLIENT_360_MATRIX_SCHEMA_VERSION


@pytest.fixture
def matrix_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Matriz",
        identifier="CMAT",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    module = Module.objects.create(
        name="Módulo A",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project, module


def _matrix_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/matrix/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceClient360MatrixAPI:
    EXPECTED_TOP_KEYS = {
        "schema_version",
        "weeks_requested",
        "anchor_period_start",
        "anchor_period_end",
        "weeks",
        "pagination",
        "clients",
    }
    EXPECTED_CELL_KEYS = {
        "period_start",
        "period_end",
        "coverage",
        "modules_total",
        "modules_published",
        "modules_draft",
        "module_breakdown",
    }

    def test_empty_matrix(self, session_client, workspace, setup_instance):
        response = session_client.get(_matrix_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert set(response.data.keys()) == self.EXPECTED_TOP_KEYS
        assert response.data["schema_version"] == CLIENT_360_MATRIX_SCHEMA_VERSION
        assert response.data["weeks_requested"] == 8
        assert len(response.data["weeks"]) == 8
        assert response.data["clients"] == []

    def test_matrix_cells_for_project(
        self,
        session_client,
        workspace,
        workspace_board,
        create_user,
        matrix_project,
        setup_instance,
    ):
        project, module = matrix_project
        anchor = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))

        BoardStatusReport.objects.create(
            project=project,
            workspace=workspace,
            board=workspace_board,
            module=module,
            period_start=anchor.start,
            period_end=anchor.end,
            created_by=create_user,
            published_at=timezone.now(),
        )

        response = session_client.get(
            _matrix_url(workspace.slug),
            {
                "period_start": anchor.start.isoformat(),
                "period_end": anchor.end.isoformat(),
                "weeks": 8,
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["clients"]) == 1
        cells = response.data["clients"][0]["cells"]
        assert len(cells) == 8
        assert set(cells[-1].keys()) == self.EXPECTED_CELL_KEYS
        assert cells[-1]["coverage"] == "complete"

    def test_invalid_weeks(self, session_client, workspace, setup_instance):
        response = session_client.get(_matrix_url(workspace.slug), {"weeks": 99})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
