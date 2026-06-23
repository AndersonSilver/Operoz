from __future__ import annotations

from unittest.mock import patch

import pytest
from django.test import override_settings

from operis.assistant.quality import record_assistant_response
from operis.assistant.security.audit import log_assistant_action
from operis.bgtasks.assistant_deferred_task import record_assistant_response_task
from operis.db.models import AssistantQualityDaily
from operis.assistant.thread_summarization import (
    CONTEXT_SUMMARY_KEY,
    build_llm_history,
    get_persisted_summary,
    persist_session_summary,
    schedule_session_summarization,
)
from operis.db.models import AssistantMessage, AssistantSession


@pytest.mark.unit
@pytest.mark.django_db
class TestDeferredAssistant:
    @override_settings(ASSISTANT_DEFER_NONCRITICAL="1")
    @patch("operis.bgtasks.assistant_deferred_task.record_assistant_response_task")
    def test_record_assistant_response_defers(self, mock_task, workspace):
        record_assistant_response(workspace, used_tools=True, first_token_ms=900)
        mock_task.delay.assert_called_once()

    @override_settings(ASSISTANT_DEFER_NONCRITICAL="1")
    def test_record_assistant_response_task_persists_without_requeue(self, workspace):
        record_assistant_response_task(
            workspace_id=str(workspace.id),
            used_tools=True,
            first_token_ms=900,
        )
        row = AssistantQualityDaily.objects.get(workspace=workspace)
        assert row.response_count == 1
        assert row.tool_response_count == 1

    @override_settings(ASSISTANT_DEFER_NONCRITICAL="1")
    @patch("operis.bgtasks.assistant_deferred_task.log_assistant_action_task")
    def test_log_assistant_action_defers(self, mock_task, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        result = log_assistant_action(
            workspace=workspace,
            user=create_user,
            session=session,
            tool_name="search_issues",
            action_type="tool_call",
        )
        assert result is None
        mock_task.delay.assert_called_once()

    @patch.dict("os.environ", {"ASSISTANT_SUMMARY_SYNC": "0"})
    @patch("operis.bgtasks.assistant_deferred_task.summarize_session_task")
    def test_schedule_summarization_only_for_long_threads(self, mock_task, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        for index in range(15):
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_USER if index % 2 == 0 else AssistantMessage.ROLE_ASSISTANT,
                content=f"msg {index}",
            )
        schedule_session_summarization(str(session.id))
        mock_task.delay.assert_called_once_with(str(session.id))

    @patch.dict("os.environ", {"ASSISTANT_SUMMARY_SYNC": "0"})
    def test_build_llm_history_uses_persisted_summary(self, create_user, workspace):
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={CONTEXT_SUMMARY_KEY: "Resumo persistido da thread", "thread_summary_message_count": 16},
        )
        for index in range(16):
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_USER if index % 2 == 0 else AssistantMessage.ROLE_ASSISTANT,
                content=f"Mensagem {index}",
            )

        history = build_llm_history(session)
        assert "Resumo persistido da thread" in history[0]["content"]
        assert get_persisted_summary(session) == "Resumo persistido da thread"

    @patch("operis.assistant.thread_summarization.summarize_message_batch", return_value="Resumo LLM async")
    def test_persist_session_summary_writes_context(self, _mock_summary, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        for index in range(16):
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_USER if index % 2 == 0 else AssistantMessage.ROLE_ASSISTANT,
                content=f"Mensagem {index}",
            )

        summary = persist_session_summary(session)
        session.refresh_from_db()
        assert summary == "Resumo LLM async"
        assert session.context[CONTEXT_SUMMARY_KEY] == "Resumo LLM async"
