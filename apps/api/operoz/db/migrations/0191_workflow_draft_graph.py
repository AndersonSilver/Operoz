# Persist workflow editor node positions between saves

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0190_workflow_default_schemes"),
    ]

    operations = [
        migrations.AddField(
            model_name="workflow",
            name="draft_graph",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
