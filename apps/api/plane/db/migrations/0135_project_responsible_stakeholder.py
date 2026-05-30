# Generated manually for Tech4Humans status report

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0134_board_status_report_project_module"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="responsible_stakeholder",
            field=models.CharField(
                blank=True,
                default="",
                max_length=255,
                verbose_name="Stakeholder responsável",
            ),
        ),
    ]
