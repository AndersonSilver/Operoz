from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0161_assistant_chat_job"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS search_emb_content_fts_gin_idx
                ON search_embeddings
                USING gin (to_tsvector('simple', coalesce(content, '')));
            """,
            reverse_sql="DROP INDEX IF EXISTS search_emb_content_fts_gin_idx;",
        ),
    ]
