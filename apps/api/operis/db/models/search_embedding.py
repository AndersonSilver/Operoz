from django.db import models
from pgvector.django import HnswIndex, VectorField

from .base import BaseModel

EMBEDDING_DIMENSIONS = 1536


class SearchEmbedding(BaseModel):
    ENTITY_ISSUE = "issue"
    ENTITY_PAGE = "page"
    ENTITY_COMMENT = "comment"
    ENTITY_PLAYBOOK = "playbook"
    ENTITY_CLIENT360_SNAPSHOT = "client360_snapshot"

    ENTITY_TYPE_CHOICES = (
        (ENTITY_ISSUE, "Issue"),
        (ENTITY_PAGE, "Page"),
        (ENTITY_COMMENT, "Comment"),
        (ENTITY_PLAYBOOK, "Playbook"),
        (ENTITY_CLIENT360_SNAPSHOT, "Client360 snapshot"),
    )

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="search_embeddings",
    )
    entity_type = models.CharField(max_length=32, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.UUIDField(db_index=True)
    chunk_index = models.PositiveIntegerField(default=0)
    content = models.TextField()
    content_hash = models.CharField(max_length=64, blank=True, default="")
    embedding = VectorField(dimensions=EMBEDDING_DIMENSIONS)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "search_embeddings"
        ordering = ("entity_type", "entity_id", "chunk_index")
        constraints = [
            models.UniqueConstraint(
                fields=["entity_type", "entity_id", "chunk_index"],
                name="search_embedding_entity_chunk_unique",
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "entity_type"], name="search_emb_ws_type_idx"),
            models.Index(fields=["workspace", "entity_id"], name="search_emb_ws_entity_idx"),
            HnswIndex(
                name="search_emb_hnsw_cosine_idx",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ]

    def __str__(self) -> str:
        return f"{self.entity_type}:{self.entity_id}#{self.chunk_index}"
