from datetime import date
from unittest.mock import MagicMock, patch

import pytest

from operis.assistant.quality import (
    adjust_feedback_daily,
    get_assistant_quality_dashboard,
    record_assistant_response,
)
from operis.automation.quality import build_workspace_automation_quality
from operis.db.models import AssistantQualityDaily, AssistantQualityReview


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantQuality:
    def test_record_response_increments_daily(self, workspace):
        record_assistant_response(workspace, used_tools=True, first_token_ms=1200)
        row = AssistantQualityDaily.objects.get(workspace=workspace, quality_date=date.today())
        assert row.response_count == 1
        assert row.tool_response_count == 1

    def test_adjust_feedback_daily(self, workspace):
        adjust_feedback_daily(workspace, old_rating=None, new_rating="up")
        adjust_feedback_daily(workspace, old_rating="up", new_rating="down")
        row = AssistantQualityDaily.objects.get(workspace=workspace, quality_date=date.today())
        assert row.feedback_up == 0
        assert row.feedback_down == 1

    @patch("operis.assistant.quality.redis_instance")
    def test_dashboard_targets(self, mock_redis, workspace, create_user):
        user = create_user
        AssistantQualityDaily.objects.create(
            workspace=workspace,
            quality_date=date.today(),
            response_count=10,
            tool_response_count=7,
            feedback_up=8,
            feedback_down=2,
        )
        AssistantQualityReview.objects.create(
            workspace=workspace,
            reviewer=user,
            verdict=AssistantQualityReview.VERDICT_HALLUCINATION,
            notes="inventou prazo",
        )
        AssistantQualityReview.objects.create(
            workspace=workspace,
            reviewer=user,
            verdict=AssistantQualityReview.VERDICT_OK,
        )
        ri = MagicMock()
        ri.zrange.return_value = [(b"a", 2500), (b"b", 2800), (b"c", 3100)]
        mock_redis.return_value = ri

        dashboard = get_assistant_quality_dashboard(workspace, days=7)
        assert dashboard["tool_usage"]["rate"] == 0.7
        assert dashboard["tool_usage"]["meets_target"] is True
        assert dashboard["satisfaction"]["rate"] == 0.8
        assert dashboard["latency"]["p95_first_token_ms"] == 3100
        assert dashboard["hallucination_reviews"]["rate"] == 0.5

    def test_automation_quality_empty(self, workspace):
        summary = build_workspace_automation_quality(workspace, days=7)
        assert summary["run_count"] == 0
        assert summary["p95_duration_ms"] is None
