from __future__ import annotations

from datetime import date

import pytest
from django.utils import timezone
from rest_framework import status

from operoz.db.models import BoardStatusReport, Module, Project, ProjectMember
from operoz.utils.client_360 import WeekPeriod


@pytest.fixture
def compare_project(db, workspace, workspace_board, create_user):
    project = Project.objects.create(
        name="Cliente Compare",
        identifier="CMP",
        workspace=workspace,
        board=workspace_board,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, role=20, is_active=True)
    module = Module.objects.create(
        name="Mod Compare",
        project=project,
        workspace=workspace,
        created_by=create_user,
    )
    return project, module


def _list_url(workspace_slug: str) -> str:
    return f"/api/workspaces/{workspace_slug}/client-360/"


@pytest.mark.contract
@pytest.mark.django_db
class TestWorkspaceClient360PeriodCompareAPI:
    def test_compare_includes_period_compare_block(
        self, session_client, workspace, workspace_board, create_user, compare_project, setup_instance
    ):
        project, module = compare_project
        current = WeekPeriod(start=date(2026, 6, 9), end=date(2026, 6, 15))
        previous = WeekPeriod(start=date(2026, 6, 2), end=date(2026, 6, 8))

        BoardStatusReport.objects.create(
            project=project,
            workspace=workspace,
            board=workspace_board,
            module=module,
            period_start=current.start,
            period_end=current.end,
            created_by=create_user,
            published_at=timezone.now(),
        )

        response = session_client.get(
            _list_url(workspace.slug),
            {
                "period_start": current.start.isoformat(),
                "period_end": current.end.isoformat(),
                "compare": "1",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert "period_compare" in response.data
        assert response.data["period_compare"]["available"] is True
        assert response.data["period_compare"]["previous_period_start"] == previous.start.isoformat()
        assert "summary_delta" in response.data["period_compare"]
        client = response.data["clients"][0]
        assert "period_compare" in client
        assert client["period_compare"]["available"] is True

    def test_without_compare_omits_block(self, session_client, workspace, setup_instance):
        response = session_client.get(_list_url(workspace.slug))
        assert response.status_code == status.HTTP_200_OK
        assert "period_compare" not in response.data
