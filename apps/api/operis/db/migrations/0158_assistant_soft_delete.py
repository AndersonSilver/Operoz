from django.db import migrations, models


ASSISTANT_TABLES = (
    "assistantsession",
    "assistantmessage",
    "searchembedding",
    "assistantactionaudit",
    "assistantusagedaily",
    "assistantqualitydaily",
    "assistantqualityreview",
)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0157_assistant_quality"),
    ]

    operations = [
        migrations.AddField(
            model_name=model,
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="Deleted At"),
        )
        for model in ASSISTANT_TABLES
    ]
