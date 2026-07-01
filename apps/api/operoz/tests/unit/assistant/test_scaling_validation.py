from __future__ import annotations

import concurrent.futures
import os
import statistics
import threading
import time
from unittest.mock import patch

import pytest

from operoz.app.permissions import ROLE
from operoz.assistant.service import iter_chat_events
from operoz.db.models import AssistantSession, User, WorkspaceMember

ERROR_RATE_MAX = 0.05
P95_FIRST_TOKEN_MS_MAX = 3000

_thread_state = threading.local()


def _load_vus() -> int:
    raw = os.environ.get("ASSISTANT_LOAD_VUS", "150")
    try:
        return max(1, min(150, int(raw)))
    except ValueError:
        return 150


def _mock_stream_simple():
    yield {"type": "token", "content": "ok"}
    yield {"type": "complete", "content": "Resposta simulada.", "model": "gpt-4o-mini"}


def _mock_stream_with_tool():
    yield {
        "type": "tool_calls",
        "tool_calls": [
            {
                "id": "call_1",
                "type": "function",
                "function": {"name": "search_issues", "arguments": '{"query":"x","limit":1}'},
            }
        ],
        "content": "",
        "model": "gpt-4o-mini",
    }


def _mock_stream_after_tool():
    yield {"type": "token", "content": "done"}
    yield {"type": "complete", "content": "Feito.", "model": "gpt-4o-mini"}


def _thread_safe_stream_side_effect(*_args, **_kwargs):
    with_tool = bool(getattr(_thread_state, "with_tool", False))
    round_no = int(getattr(_thread_state, "round", 0))
    _thread_state.round = round_no + 1
    if with_tool and round_no == 0:
        return _mock_stream_with_tool()
    if with_tool:
        return _mock_stream_after_tool()
    return _mock_stream_simple()


def _run_single_chat(session_id: str, *, with_tool: bool) -> dict:
    from django.db import close_old_connections

    close_old_connections()
    _thread_state.with_tool = with_tool
    _thread_state.round = 0

    session = AssistantSession.objects.select_related("workspace", "user").get(pk=session_id)
    started = time.perf_counter()
    first_token_ms: int | None = None
    success = False
    error: str | None = None

    try:
        for event in iter_chat_events(session, "mensagem de teste", stream=True, skip_llm_wait=True):
            if event["type"] == "token" and first_token_ms is None:
                first_token_ms = int((time.perf_counter() - started) * 1000)
            if event["type"] == "done":
                success = True
            if event["type"] == "error":
                error = event.get("error", "error")
    except Exception as exc:
        error = str(exc)
    finally:
        close_old_connections()

    return {
        "success": success,
        "first_token_ms": first_token_ms,
        "duration_ms": int((time.perf_counter() - started) * 1000),
        "error": error,
    }


@pytest.mark.django_db(transaction=True)
class TestScalingValidation:
    @patch("operoz.assistant.service.release_active_chat")
    @patch("operoz.assistant.service.acquire_active_chat", return_value=True)
    @patch("operoz.assistant.service.release_llm_slot")
    @patch("operoz.assistant.service.try_acquire_llm_slot", return_value=True)
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.hybrid_retrieve", return_value=[])
    @patch("operoz.assistant.service.stream_chat_completion", side_effect=_thread_safe_stream_side_effect)
    def test_concurrent_chat_load(
        self,
        _stream,
        _rag,
        _record,
        _rate,
        _try_llm,
        _release_llm,
        _acquire_active_chat,
        _release_active_chat,
        create_user,
        workspace,
    ):
        """Simula 150 VUs (configurável via ASSISTANT_LOAD_VUS) com LLM mockado."""
        vus = _load_vus()
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )

        sessions: list[AssistantSession] = []
        for index in range(vus):
            user = create_user if index == 0 else User.objects.create(
                email=f"load-vu-{index}@plane.so",
                username=f"load_vu_{index}",
            )
            if index > 0:
                WorkspaceMember.objects.get_or_create(
                    workspace=workspace,
                    member=user,
                    defaults={"role": ROLE.MEMBER.value},
                )
            sessions.append(
                AssistantSession.objects.create(
                    workspace=workspace,
                    user=user,
                    title=f"Load {index}",
                    context={},
                )
            )

        started = time.perf_counter()
        results: list[dict] = []
        max_workers = min(32, vus)

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = [
                pool.submit(
                    _run_single_chat,
                    str(session.id),
                    with_tool=(index % 10 < 3),
                )
                for index, session in enumerate(sessions)
            ]
            for future in concurrent.futures.as_completed(futures):
                results.append(future.result())

        elapsed = time.perf_counter() - started
        successes = [r for r in results if r["success"]]
        failures = [r for r in results if not r["success"]]
        error_rate = len(failures) / len(results) if results else 1.0

        first_tokens = [r["first_token_ms"] for r in successes if r["first_token_ms"] is not None]
        p95_first_token = (
            int(statistics.quantiles(first_tokens, n=20)[18])
            if len(first_tokens) >= 20
            else (max(first_tokens) if first_tokens else None)
        )

        durations = [r["duration_ms"] for r in successes]
        p95_duration = (
            int(statistics.quantiles(durations, n=20)[18])
            if len(durations) >= 20
            else (max(durations) if durations else None)
        )

        print(
            f"\nLOAD_SUMMARY vus={vus} success={len(successes)} "
            f"errors={len(failures)} error_rate={error_rate:.2%} "
            f"p95_first_token_ms={p95_first_token} p95_duration_ms={p95_duration} "
            f"wall_seconds={elapsed:.1f}"
        )

        assert error_rate <= ERROR_RATE_MAX, (
            f"Taxa de erro {error_rate:.2%} > {ERROR_RATE_MAX:.0%}. "
            f"Falhas: {[f.get('error') for f in failures[:5]]}"
        )
        assert p95_first_token is not None and p95_first_token < P95_FIRST_TOKEN_MS_MAX, (
            f"P95 first token {p95_first_token}ms >= {P95_FIRST_TOKEN_MS_MAX}ms"
        )
