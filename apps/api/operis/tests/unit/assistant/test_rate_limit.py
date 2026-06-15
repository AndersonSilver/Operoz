from unittest.mock import MagicMock, patch

import pytest

from operis.assistant.security.rate_limit import check_assistant_rate_limit, record_assistant_message


@pytest.mark.unit
class TestAssistantRateLimit:
    @patch("operis.assistant.security.rate_limit._assistant_limits", return_value=(True, 2, 100))
    @patch("operis.assistant.security.rate_limit.redis_instance")
    def test_user_rate_limit_returns_retry_after(self, mock_redis, _limits):
        ri = MagicMock()
        ri.get.side_effect = lambda key: b"2" if "user" in key else b"0"
        ri.ttl.return_value = 1800
        mock_redis.return_value = ri

        allowed, reason, retry_after = check_assistant_rate_limit("ws-1", "user-1")
        assert allowed is False
        assert reason == "user_rate_limit"
        assert retry_after == 1800

    @patch("operis.assistant.security.rate_limit._assistant_limits", return_value=(True, 60, 3))
    @patch("operis.assistant.security.rate_limit.redis_instance")
    def test_workspace_rate_limit(self, mock_redis, _limits):
        ri = MagicMock()
        ri.get.side_effect = lambda key: b"3" if "workspace" in key else b"0"
        ri.ttl.return_value = 900
        mock_redis.return_value = ri

        allowed, reason, retry_after = check_assistant_rate_limit("ws-1", "user-1")
        assert allowed is False
        assert reason == "workspace_rate_limit"
        assert retry_after == 900

    @patch("operis.assistant.security.rate_limit.redis_instance")
    def test_record_assistant_message_increments(self, mock_redis):
        pipe = MagicMock()
        ri = MagicMock()
        ri.pipeline.return_value = pipe
        mock_redis.return_value = ri

        record_assistant_message("ws-1", "user-1")
        assert pipe.incr.call_count == 2
        pipe.execute.assert_called_once()
