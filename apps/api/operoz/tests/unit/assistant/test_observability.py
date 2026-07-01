from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operoz.assistant.observability import (
    collect_assistant_metrics,
    evaluate_assistant_alerts,
    record_chat_outcome,
    record_rag_cache_access,
    render_prometheus_metrics,
)
from operoz.devops.celery_queue_monitor import queue_alert_threshold, queues_exceeding_threshold


@pytest.mark.unit
class TestAssistantObservability:
    @patch("operoz.assistant.observability.count_stale_assistant_jobs", return_value=0)
    @patch("operoz.assistant.observability.get_queue_depths", return_value={"assistant-chat": 12})
    @patch("operoz.assistant.observability._count_active_chats", return_value=3)
    @patch("operoz.assistant.observability.llm_semaphore_available", return_value=37)
    @patch("operoz.assistant.observability.llm_slots_in_use", return_value=3)
    @patch("operoz.assistant.observability._rag_cache_hit_ratio", return_value=0.75)
    @patch("operoz.assistant.observability._global_latency_p95_ms", return_value=2100)
    @patch("operoz.assistant.observability._chat_error_rate", return_value=0.01)
    def test_collect_metrics(self, *_mocks):
        metrics = collect_assistant_metrics()
        assert metrics["assistant_chat_active"] == 3
        assert metrics["assistant_chat_stale_jobs"] == 0
        assert metrics["assistant_chat_queue_depth"] == 12
        assert metrics["assistant_llm_semaphore_available"] == 37
        assert metrics["assistant_rag_cache_hit_ratio"] == 0.75

    @patch("operoz.assistant.observability.collect_assistant_metrics")
    def test_prometheus_render(self, mock_collect):
        mock_collect.return_value = {
            "assistant_chat_active": 2,
            "assistant_chat_queue_depth": 0,
            "assistant_chat_stale_jobs": 0,
            "assistant_llm_semaphore_available": 40,
            "assistant_llm_semaphore_in_use": 0,
            "assistant_rag_cache_hit_ratio": 0.5,
            "assistant_latency_p95_first_token_ms": 1500,
            "assistant_chat_error_rate": 0.02,
            "collected_at": 1,
        }
        body = render_prometheus_metrics()
        assert "assistant_chat_stale_jobs" in body
        assert "assistant_chat_active 2" in body
        assert "# TYPE assistant_chat_queue_depth gauge" in body

    @patch("operoz.assistant.observability.collect_assistant_metrics")
    def test_evaluate_alerts(self, mock_collect):
        mock_collect.return_value = {
            "assistant_latency_p95_first_token_ms": 4500,
            "assistant_chat_error_rate": 0.08,
            "assistant_chat_queue_depth": 150,
            "assistant_chat_stale_jobs": 2,
        }
        alerts = evaluate_assistant_alerts()
        codes = {a["code"] for a in alerts}
        assert "latency_p95_first_token" in codes
        assert "chat_error_rate" in codes
        assert "assistant_chat_queue_depth" in codes
        assert "assistant_chat_stale_jobs" in codes

    @patch("operoz.assistant.observability.redis_instance")
    def test_record_counters(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        record_rag_cache_access(hit=True)
        record_rag_cache_access(hit=False)
        record_chat_outcome(success=True)
        record_chat_outcome(success=False)
        assert ri.incr.call_count == 4


@pytest.mark.unit
class TestQueueThresholds:
    def test_assistant_chat_lower_threshold(self):
        with patch.dict("os.environ", {"ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD": "100"}):
            assert queue_alert_threshold("assistant-chat", global_threshold=500) == 100

    def test_other_queues_use_global(self):
        assert queue_alert_threshold("automation", global_threshold=500) == 500

    def test_per_queue_alerts(self):
        depths = {"assistant-chat": 100, "automation": 10}
        alerts = queues_exceeding_threshold(depths, 500)
        assert len(alerts) == 1
        assert alerts[0]["queue"] == "assistant-chat"
        assert alerts[0]["threshold"] == 100
