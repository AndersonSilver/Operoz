import pytest
from django.test import override_settings
from rest_framework import status

from operoz.assistant.retrieval import RetrievedChunk


def semantic_search_url(workspace_slug):
    return f"/api/v1/workspaces/{workspace_slug}/search/semantic/"


@pytest.fixture
def fake_chunk():
    return RetrievedChunk(
        embedding_id="11111111-1111-1111-1111-111111111111",
        entity_type="page",
        entity_id="22222222-2222-2222-2222-222222222222",
        chunk_index=2,
        content="O fluxo de aprovação de PRD exige revisão do tech lead.",
        metadata={"title": "Processo de PRD"},
        combined_score=0.843129,
        untrusted=False,
        citation={"type": "page", "title": "Processo de PRD"},
    )


@pytest.mark.contract
class TestSemanticSearch:
    def test_requires_authentication(self, api_client, workspace):
        response = api_client.post(semantic_search_url(workspace.slug), {"query": "prd"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_rejects_empty_query(self, api_key_client, workspace):
        response = api_key_client.post(semantic_search_url(workspace.slug), {"query": "   "}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_missing_query(self, api_key_client, workspace):
        response = api_key_client.post(semantic_search_url(workspace.slug), {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_non_member_workspace(self, api_key_client, workspace):
        response = api_key_client.post(semantic_search_url("outro-workspace"), {"query": "prd"}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_is_not_allowed(self, api_key_client, workspace):
        response = api_key_client.get(semantic_search_url(workspace.slug))
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_returns_empty_when_index_is_empty(self, api_key_client, workspace):
        response = api_key_client.post(semantic_search_url(workspace.slug), {"query": "prd"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data == {"snippets": [], "citations": [], "count": 0}

    def test_returns_snippets_and_citations(self, api_key_client, workspace, monkeypatch, fake_chunk):
        monkeypatch.setattr(
            "operoz.api.views.search.hybrid_retrieve",
            lambda ctx, query, top_k=None: [fake_chunk],
        )

        response = api_key_client.post(
            semantic_search_url(workspace.slug), {"query": "aprovação de PRD"}, format="json"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["citations"] == [{"type": "page", "title": "Processo de PRD"}]
        snippet = response.data["snippets"][0]
        assert snippet["entity_type"] == "page"
        assert snippet["entity_id"] == fake_chunk.entity_id
        assert snippet["chunk_index"] == 2
        assert snippet["score"] == 0.8431  # arredondado para 4 casas
        assert snippet["untrusted"] is False
        assert snippet["metadata"] == {"title": "Processo de PRD"}

    def test_passes_scope_from_body(self, api_key_client, workspace, monkeypatch):
        captured = {}

        def _capture(ctx, query, top_k=None):
            captured["board_slug"] = ctx.board_slug
            captured["project_id"] = ctx.project_id
            captured["workspace"] = ctx.workspace.slug
            return []

        monkeypatch.setattr("operoz.api.views.search.hybrid_retrieve", _capture)

        api_key_client.post(
            semantic_search_url(workspace.slug),
            {"query": "prd", "board_slug": "squad-x", "project_id": "33333333-3333-3333-3333-333333333333"},
            format="json",
        )

        assert captured == {
            "board_slug": "squad-x",
            "project_id": "33333333-3333-3333-3333-333333333333",
            "workspace": workspace.slug,
        }

    @pytest.mark.parametrize(
        "raw_limit,expected",
        [(None, 5), ("nao-numero", 5), (0, 1), (-3, 1), (7, 7), (999, 20)],
    )
    def test_clamps_limit(self, api_key_client, workspace, monkeypatch, raw_limit, expected):
        captured = {}

        def _capture(ctx, query, top_k=None):
            captured["top_k"] = top_k
            return []

        monkeypatch.setattr("operoz.api.views.search.hybrid_retrieve", _capture)

        payload = {"query": "prd"}
        if raw_limit is not None:
            payload["limit"] = raw_limit

        api_key_client.post(semantic_search_url(workspace.slug), payload, format="json")
        assert captured["top_k"] == expected

    @override_settings(ASSISTANT_RAG_ENABLED="0")
    def test_returns_503_when_rag_is_disabled(self, api_key_client, workspace):
        response = api_key_client.post(semantic_search_url(workspace.slug), {"query": "prd"}, format="json")
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
