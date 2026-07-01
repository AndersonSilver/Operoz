from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0162_search_embedding_fts_gin"),
    ]

    operations = [
        migrations.AddField(
            model_name="assistantchatjob",
            name="estimated_wait_seconds",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="assistantchatjob",
            name="queue_position",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
