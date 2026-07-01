import uuid

import django.db.models.deletion
import pgvector.django
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0150_assistant"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        pgvector.django.VectorExtension(),
        migrations.CreateModel(
            name="SearchEmbedding",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "entity_type",
                    models.CharField(
                        choices=[
                            ("issue", "Issue"),
                            ("page", "Page"),
                            ("comment", "Comment"),
                            ("playbook", "Playbook"),
                        ],
                        max_length=32,
                    ),
                ),
                ("entity_id", models.UUIDField(db_index=True)),
                ("chunk_index", models.PositiveIntegerField(default=0)),
                ("content", models.TextField()),
                ("content_hash", models.CharField(blank=True, default="", max_length=64)),
                ("embedding", pgvector.django.VectorField(dimensions=1536)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="search_embeddings",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "search_embeddings",
                "ordering": ("entity_type", "entity_id", "chunk_index"),
            },
        ),
        migrations.AddIndex(
            model_name="searchembedding",
            index=models.Index(fields=["workspace", "entity_type"], name="search_emb_ws_type_idx"),
        ),
        migrations.AddIndex(
            model_name="searchembedding",
            index=models.Index(fields=["workspace", "entity_id"], name="search_emb_ws_entity_idx"),
        ),
        migrations.AddConstraint(
            model_name="searchembedding",
            constraint=models.UniqueConstraint(
                fields=("entity_type", "entity_id", "chunk_index"),
                name="search_embedding_entity_chunk_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="searchembedding",
            index=pgvector.django.HnswIndex(
                name="search_emb_hnsw_cosine_idx",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
        ),
    ]
