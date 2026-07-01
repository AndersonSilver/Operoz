from unittest.mock import patch

import pytest

from operoz.assistant.service import run_chat
from operoz.db.models import AssistantMessage, AssistantSession, WorkspaceMember
from operoz.app.permissions import ROLE


@pytest.mark.unit
@pytest.mark.django_db
class TestAssistantService:
    @patch("operoz.assistant.service.stream_chat_completion")
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    def test_run_chat_with_tools_mock(
        self,
        _rate,
        _record,
        mock_stream,
        create_user,
        workspace,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={"board_slug": "test-board"},
        )

        def _stream_round_one(*_args, **_kwargs):
            yield {
                "type": "tool_calls",
                "tool_calls": [
                    {
                        "id": "call_1",
                        "type": "function",
                        "function": {
                            "name": "search_issues",
                            "arguments": '{"query": "test", "limit": 1}',
                        },
                    }
                ],
                "content": "",
                "model": "gpt-4o-mini",
            }

        def _stream_round_two(*_args, **_kwargs):
            yield {"type": "complete", "content": "Não encontrei cards com essa busca.", "model": "gpt-4o-mini"}

        mock_stream.side_effect = [_stream_round_one(), _stream_round_two()]

        reply = run_chat(session, "Liste cards de teste")

        assert reply.role == AssistantMessage.ROLE_ASSISTANT
        assert "Não encontrei" in reply.content
        assert session.messages.filter(role=AssistantMessage.ROLE_TOOL).count() == 1
        assert mock_stream.call_count == 2

    @patch("operoz.assistant.service.stream_chat_completion")
    @patch("operoz.assistant.service.hybrid_retrieve", return_value=[])
    @patch("operoz.assistant.service.record_assistant_message")
    @patch("operoz.assistant.service.check_assistant_rate_limit", return_value=(True, "ok", 0))
    def test_iter_chat_events_yields_tokens_before_done(
        self,
        _rate,
        _record,
        _rag,
        mock_stream,
        create_user,
        workspace,
    ):
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=create_user,
            defaults={"role": ROLE.ADMIN.value},
        )
        session = AssistantSession.objects.create(
            workspace=workspace,
            user=create_user,
            context={},
        )

        def _stream(*_args, **_kwargs):
            yield {"type": "token", "content": "Olá"}
            yield {"type": "token", "content": " mundo"}
            yield {"type": "complete", "content": "Olá mundo", "model": "gpt-4o-mini"}

        mock_stream.return_value = _stream()

        from operoz.assistant.service import iter_chat_events

        events = list(iter_chat_events(session, "Oi", stream=True))
        types = [event["type"] for event in events]

        assert types.index("token") < types.index("done")
        assert types.count("token") == 2
        assert events[-1]["type"] == "done"
        assert events[-1]["message"]["content"] == "Olá mundo"
