import pytest

from operoz.utils.client_360 import build_client_row
from operoz.utils.client_360_health_alerts import (
    DEFAULT_SCORE_ALERT_THRESHOLD,
    build_client360_list_summary,
    is_health_score_alert,
    resolve_score_alert_threshold,
)


@pytest.mark.unit
class TestScoreAlertThreshold:
    def test_default_threshold_is_40(self):
        assert DEFAULT_SCORE_ALERT_THRESHOLD == 40
        assert resolve_score_alert_threshold(None) == 40

    def test_custom_threshold(self):
        assert resolve_score_alert_threshold(50) == 50

    def test_alert_when_score_below_threshold(self):
        assert is_health_score_alert(45, 50) is True
        assert is_health_score_alert(50, 50) is False
        assert is_health_score_alert(55, 50) is False

    def test_default_threshold_alert(self):
        assert is_health_score_alert(39) is True
        assert is_health_score_alert(40) is False


@pytest.mark.unit
class TestBuildClient360ListSummary:
    def test_counts_score_alerts(self):
        clients = [
            {
                "health": "ok",
                "status_report": {"coverage": "complete"},
                "issues": {"overdue": 0},
                "support": {"open_count": 0},
                "health_score_alert": True,
            },
            {
                "health": "warning",
                "status_report": {"coverage": "partial"},
                "issues": {"overdue": 1},
                "support": {"open_count": 0},
                "health_score_alert": False,
            },
        ]
        summary = build_client360_list_summary(clients)
        assert summary["health_score_alert"] == 1
        assert summary["total_clients"] == 2


@pytest.mark.django_db
class TestBuildClientRowScoreAlert:
    def test_row_includes_alert_fields(self, workspace, create_user):
        from operoz.db.models import Board, Project

        board = Board.objects.create(name="Alert Board", slug="alert-board", workspace=workspace)
        project = Project.objects.create(
            name="Alert Client",
            identifier="ALRT",
            workspace=workspace,
            board=board,
            created_by=create_user,
        )
        from operoz.utils.client_360 import current_week_period

        period = current_week_period()
        row = build_client_row(
            project,
            period=period,
            modules_total=0,
            issue_stats=None,
            report_stats=None,
            score_alert_threshold=50,
        )
        assert row["score_alert_threshold"] == 50
        assert isinstance(row["health_score_alert"], bool)
