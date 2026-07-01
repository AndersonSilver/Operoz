import pytest

from operoz.db.models import Workspace, WorkspaceClient360Settings
from operoz.utils.client_360 import build_client_row, compute_health, health_level_from_score
from operoz.utils.client_360_display import (
    client_360_display_payload,
    health_score_display_enabled,
)


@pytest.mark.unit
class TestHealthScoreRagMapping:
    def test_score_maps_to_health_labels(self):
        assert health_level_from_score(85) == "ok"
        assert health_level_from_score(55) == "warning"
        assert health_level_from_score(30) == "critical"


@pytest.mark.django_db
class TestLegacyHealthField:
    def test_build_client_row_includes_legacy_health(self, workspace, create_user):
        from operoz.db.models import Board, Project
        from operoz.utils.client_360 import current_week_period

        board = Board.objects.create(name="Legacy Board", slug="legacy-board", workspace=workspace)
        project = Project.objects.create(
            name="Legacy Client",
            identifier="LEG",
            workspace=workspace,
            board=board,
            created_by=create_user,
        )
        period = current_week_period()
        row = build_client_row(
            project,
            period=period,
            modules_total=2,
            issue_stats={"total": 0, "pending": 0, "overdue": 0, "support_open": 0, "support_overdue": 0},
            report_stats={"modules_published": 0, "modules_draft_only": 0, "has_project_level_published": False},
        )
        assert row["health"] in {"ok", "warning", "critical"}
        assert isinstance(row["health_score"], int)
        assert row["legacy_health"] == compute_health(
            report_coverage=row["status_report"]["coverage"],
            overdue_issues=0,
            support_open=0,
            support_overdue=0,
        )


@pytest.mark.django_db
class TestHealthScoreDisplayFlag:
    def test_default_off_without_settings(self, workspace):
        assert health_score_display_enabled(workspace) is False
        assert client_360_display_payload(workspace) == {"health_score_enabled": False}

    def test_workspace_setting_on(self, workspace, create_user):
        WorkspaceClient360Settings.objects.create(
            workspace=workspace,
            health_score_display_enabled=True,
            created_by=create_user,
        )
        assert health_score_display_enabled(workspace) is True
        assert client_360_display_payload(workspace)["health_score_enabled"] is True
