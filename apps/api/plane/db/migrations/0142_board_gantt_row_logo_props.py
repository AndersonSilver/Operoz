# Tech4Humans: ícones de linha do cronograma (projeto / módulo)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0141_board_identifier_category_space_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="board",
            name="gantt_project_logo_props",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="board",
            name="gantt_module_logo_props",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
