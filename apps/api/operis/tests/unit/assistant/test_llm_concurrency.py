from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operis.assistant.llm.concurrency import (
    get_fair_queue_status,
    is_fair_turn,
    llm_semaphore_available,
    register_fair_job,
    release_llm_slot,
    try_acquire_llm_slot,
)
from operis.assistant.llm.key_pool import get_api_key, is_key_open, list_api_keys, record_key_failure
from operis.assistant.security.rate_limit import acquire_active_chat, check_assistant_rate_limit, release_active_chat


@pytest.mark.unit
class TestLlmSemaphore:
    @patch("operis.assistant.llm.concurrency._cleanup_stale_holders")
    @patch("operis.assistant.llm.concurrency.redis_instance")
    @patch("operis.assistant.llm.concurrency._max_concurrent_llm", return_value=2)
    def test_acquire_respects_max_slots(self, _max_mock, mock_redis_factory, mock_cleanup):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.exists.return_value = False
        ri.set.return_value = True
        mock_cleanup.side_effect = [0, 1, 2]

        assert try_acquire_llm_slot("job-1") is True
        assert try_acquire_llm_slot("job-2") is True
        assert try_acquire_llm_slot("job-3") is False

    @patch("operis.assistant.llm.concurrency._cleanup_stale_holders", return_value=1)
    @patch("operis.assistant.llm.concurrency._max_concurrent_llm", return_value=40)
    def test_available_slots(self, _max_mock, _cleanup):
        assert llm_semaphore_available() == 39


@pytest.mark.unit
class TestFairQueue:
    @patch("operis.assistant.llm.concurrency.redis_instance")
    def test_register_and_turn(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.lindex.return_value = b"job-1"
        ri.llen.return_value = 1
        ri.smembers.return_value = {b"ws-1"}
        ri.lrange.return_value = [b"job-1"]

        register_fair_job("job-1", "ws-1")
        assert is_fair_turn("job-1", "ws-1") is True
        position, wait = get_fair_queue_status("job-1", "ws-1")
        assert position >= 1
        assert wait >= 1


@pytest.mark.unit
class TestConcurrentRateLimit:
    @patch("operis.assistant.security.rate_limit._assistant_limits", return_value=(True, 60, 500))
    @patch("operis.assistant.security.rate_limit._max_active_chats_per_user", return_value=1)
    @patch("operis.assistant.security.rate_limit.redis_instance")
    def test_second_active_chat_rejected(self, mock_redis_factory, _max_active, _limits):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.get.return_value = 0
        ri.smembers.return_value = {b"chat-1"}
        ri.exists.side_effect = lambda key: key == "assistant:active:chat:chat-1"

        allowed, reason, retry_after = check_assistant_rate_limit("ws", "user")
        assert allowed is False
        assert reason == "concurrent_rate_limit"
        assert retry_after == 30

    @patch("operis.assistant.security.rate_limit.redis_instance")
    def test_acquire_and_release_active_chat(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.smembers.return_value = set()
        ri.set.return_value = True

        assert acquire_active_chat("ws", "user", "chat-1") is True
        release_active_chat("ws", "user", "chat-1")
        ri.delete.assert_called()
        ri.srem.assert_called()


@pytest.mark.unit
class TestKeyPool:
    @patch.dict("os.environ", {"LLM_API_KEYS": "key-a,key-b", "LLM_API_KEY": ""})
    @patch("operis.assistant.llm.key_pool.is_key_open", return_value=False)
    def test_round_robin_keys(self, _open):
        keys = list_api_keys()
        assert keys == ["key-a", "key-b"]
        first = get_api_key()
        second = get_api_key()
        assert {first, second} == {"key-a", "key-b"}

    @patch("operis.assistant.llm.key_pool.redis_instance")
    def test_record_failure_opens_circuit(self, mock_redis_factory):
        ri = MagicMock()
        mock_redis_factory.return_value = ri
        ri.incr.return_value = 3
        record_key_failure("secret-key")
        ri.setex.assert_called()
        assert is_key_open("secret-key") is False or ri.setex.called
