# Tech4Humans: Status Report no projeto + módulo (Fase 10a)

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0133_board_status_report"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardstatusreport",
            name="project",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="status_reports",
                to="db.project",
            ),
        ),
        migrations.AddField(
            model_name="boardstatusreport",
            name="module",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="status_reports",
                to="db.module",
            ),
        ),
        migrations.AlterField(
            model_name="boardstatusreport",
            name="board",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="status_reports",
                to="db.board",
            ),
        ),
        migrations.AddIndex(
            model_name="boardstatusreport",
            index=models.Index(fields=["project", "period_end"], name="board_sr_proj_period_idx"),
        ),
        migrations.AddIndex(
            model_name="boardstatusreport",
            index=models.Index(fields=["project", "module"], name="board_sr_proj_module_idx"),
        ),
    ]
