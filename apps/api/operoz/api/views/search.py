# Third Party imports
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from operoz.assistant.retrieval import hybrid_retrieve, is_rag_enabled
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import Workspace
from operoz.utils.openapi import (
    FORBIDDEN_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
    WORKSPACE_SLUG_PARAMETER,
)
from operoz.utils.permissions import WorkspaceViewerPermission

DEFAULT_LIMIT = 5
MAX_LIMIT = 20


class WorkspaceSemanticSearchAPIEndpoint(BaseAPIView):
    """Busca semântica sobre o índice RAG do workspace.

    Mesma recuperação híbrida (FTS + vetorial) que alimentava o assistant, exposta
    como endpoint puro: não chama LLM de geração, só embeda a query. Consumido pelo
    MCP server.
    """

    permission_classes = [WorkspaceViewerPermission]

    @extend_schema(
        operation_id="search_workspace_semantic",
        summary="Semantic search over indexed workspace content",
        description=(
            "Hybrid (full-text + vector) search over the workspace RAG index: pages, "
            "work items, comments and playbooks. Results are "
            "filtered by the caller's project permissions. Does not invoke a "
            "generative model."
        ),
        tags=["Search"],
        parameters=[WORKSPACE_SLUG_PARAMETER],
        request={
            "application/json": {
                "type": "object",
                "required": ["query"],
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language question or search terms.",
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": MAX_LIMIT,
                        "default": DEFAULT_LIMIT,
                        "description": "Maximum number of snippets to return.",
                    },
                    "board_slug": {
                        "type": "string",
                        "description": "Restrict the search to a single board.",
                    },
                    "project_id": {
                        "type": "string",
                        "format": "uuid",
                        "description": "Restrict the search to a single project.",
                    },
                },
            }
        },
        responses={
            200: OpenApiResponse(
                description="Ranked snippets with citations",
                response={
                    "type": "object",
                    "properties": {
                        "count": {"type": "integer"},
                        "snippets": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "content": {"type": "string"},
                                    "entity_type": {
                                        "type": "string",
                                        "enum": [
                                            "issue",
                                            "page",
                                            "comment",
                                            "playbook",
                                        ],
                                    },
                                    "entity_id": {"type": "string", "format": "uuid"},
                                    "chunk_index": {"type": "integer"},
                                    "score": {"type": "number"},
                                    "untrusted": {"type": "boolean"},
                                    "metadata": {"type": "object"},
                                },
                            },
                        },
                        "citations": {"type": "array", "items": {"type": "object"}},
                    },
                },
                examples=[
                    OpenApiExample(
                        "Snippet hit",
                        value={
                            "count": 1,
                            "snippets": [
                                {
                                    "content": "O fluxo de aprovação de PRD exige...",
                                    "entity_type": "page",
                                    "entity_id": "9f1c...",
                                    "chunk_index": 2,
                                    "score": 0.8431,
                                    "untrusted": False,
                                    "metadata": {"title": "Processo de PRD"},
                                }
                            ],
                            "citations": [{"type": "page", "title": "Processo de PRD"}],
                        },
                    )
                ],
            ),
            400: OpenApiResponse(description="Missing or empty query"),
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
            503: OpenApiResponse(description="RAG retrieval is disabled on this instance"),
        },
    )
    def post(self, request, slug):
        """Semantic search over indexed workspace content."""
        query = str(request.data.get("query") or "").strip()
        if not query:
            return Response(
                {"error": "query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not is_rag_enabled():
            return Response(
                {"error": "RAG retrieval is disabled on this instance"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        ctx = AssistantActorContext(
            user=request.user,
            workspace=workspace,
            board_slug=(str(request.data.get("board_slug")) if request.data.get("board_slug") else None),
            project_id=(str(request.data.get("project_id")) if request.data.get("project_id") else None),
        )

        # hybrid_retrieve já reaplica o filtro de permissão por chunk; board_slug e
        # project_id apenas estreitam o escopo da busca.
        chunks = hybrid_retrieve(ctx, query, top_k=self._limit(request.data.get("limit")))

        snippets = [
            {
                "content": chunk.content,
                "entity_type": chunk.entity_type,
                "entity_id": chunk.entity_id,
                "chunk_index": chunk.chunk_index,
                "score": round(chunk.combined_score, 4),
                "untrusted": chunk.untrusted,
                "metadata": chunk.metadata,
            }
            for chunk in chunks
        ]
        citations = [chunk.citation for chunk in chunks if chunk.citation]

        return Response(
            {"snippets": snippets, "citations": citations, "count": len(snippets)},
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _limit(raw) -> int:
        try:
            value = int(raw)
        except (TypeError, ValueError):
            return DEFAULT_LIMIT
        return max(1, min(value, MAX_LIMIT))
