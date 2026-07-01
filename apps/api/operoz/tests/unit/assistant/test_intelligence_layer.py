from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from operoz.assistant.agent_orchestrator import decompose_complex_query, orchestrator_enabled
from operoz.assistant.embedding_cache import embed_texts_cached
from operoz.assistant.thread_summarization import build_llm_history, summarize_message_batch
from operoz.assistant.tool_router import AUTOMATION_TOOLS, METRICS_TOOLS, READ_TOOLS, build_tool_route_plan
from operoz.assistant.tools import handlers as _tool_handlers  # noqa: F401
from operoz.assistant.tools.registry import list_openai_tools
from operoz.db.models import AssistantMessage, AssistantSession


@pytest.mark.unit
class TestToolRouter:
    def test_documentation_routes_to_rag_and_read_tools(self):
        plan = build_tool_route_plan("O que diz a documentação do PRD?")
        assert plan.intent == "documentation"
        assert plan.use_rag is True
        assert plan.surface == "rag"
        assert plan.tool_names == READ_TOOLS

    def test_metrics_routes_to_tools_without_rag(self):
        plan = build_tool_route_plan("Quantos cards abertos no projeto?")
        assert plan.intent == "metrics"
        assert plan.use_rag is False
        assert METRICS_TOOLS.issubset(plan.tool_names)

    def test_automation_requires_confirmation_tools(self):
        plan = build_tool_route_plan("Crie uma regra de automação semanal")
        assert plan.intent == "automation"
        assert plan.surface == "action_confirm"
        assert "propose_automation_rule" in plan.confirmation_tools
        assert AUTOMATION_TOOLS.issubset(plan.tool_names)

    def test_registry_filters_tools(self):
        plan = build_tool_route_plan("Quantas métricas de automação?")
        filtered = list_openai_tools(plan.tool_names)
        names = {item["function"]["name"] for item in filtered}
        assert "propose_automation_rule" not in names
        assert "get_automation_metrics" in names


@pytest.mark.unit
class TestAgentOrchestrator:
    def test_disabled_by_default(self):
        assert orchestrator_enabled() is False
        assert decompose_complex_query("Pergunta A? E pergunta B?") is None

    @patch.dict("os.environ", {"ASSISTANT_ORCHESTRATOR_ENABLED": "1"})
    def test_decomposes_multiple_questions(self):
        plan = decompose_complex_query("Quantos cards abertos? E qual o SLA de sustentação?")
        assert plan is not None
        assert len(plan.subtasks) >= 2


@pytest.mark.unit
@pytest.mark.django_db
class TestThreadSummarization:
    def test_compact_history_uses_summary_block(self, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        for index in range(16):
            AssistantMessage.objects.create(
                session=session,
                role=AssistantMessage.ROLE_USER if index % 2 == 0 else AssistantMessage.ROLE_ASSISTANT,
                content=f"Mensagem {index}",
            )

        history = build_llm_history(session, use_llm_summary=False)
        assert history[0]["content"].startswith("[Resumo da conversa anterior")
        assert len(history) < 16

    def test_fallback_summary(self, create_user, workspace):
        session = AssistantSession.objects.create(workspace=workspace, user=create_user)
        messages = [
            AssistantMessage.objects.create(session=session, role=AssistantMessage.ROLE_USER, content="Olá"),
            AssistantMessage.objects.create(session=session, role=AssistantMessage.ROLE_ASSISTANT, content="Oi!"),
        ]
        summary = summarize_message_batch(messages, use_llm=False)
        assert "Olá" in summary
        assert "Oi" in summary


@pytest.mark.unit
class TestEmbeddingCache:
    @patch("operoz.assistant.embedding_cache.embedding_cache_scope", return_value="openai:text-embedding-3-small")
    @patch("operoz.assistant.embedding_cache._embed_texts_uncached")
    @patch("operoz.assistant.embedding_cache.cache")
    def test_cache_hit_skips_api(self, mock_cache, mock_embed, _scope):
        mock_cache.get.return_value = None
        mock_embed.return_value = [[0.1, 0.2, 0.3]]

        first = embed_texts_cached(["mesmo texto"])
        assert first == [[0.1, 0.2, 0.3]]
        assert mock_embed.call_count == 1
        assert mock_cache.set.called

        mock_cache.get.return_value = "[0.1, 0.2, 0.3]"
        second = embed_texts_cached(["mesmo texto"])
        assert second == [[0.1, 0.2, 0.3]]
        assert mock_embed.call_count == 1
