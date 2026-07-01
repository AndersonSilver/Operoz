from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0191_workflow_draft_graph"),
    ]

    operations = [
        migrations.AddField(
            model_name="module",
            name="gantt_bar_color_mode",
            field=models.CharField(
                choices=[("state", "Workflow state"), ("custom", "Custom color")],
                default="state",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="module",
            name="gantt_bar_custom_color",
            field=models.CharField(blank=True, default="", max_length=7),
        ),
    ]
