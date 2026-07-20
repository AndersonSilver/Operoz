from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0195_issue_state_changed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="intakeissue",
            name="converted_to_issue",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="intake_converted_origin",
                to="db.issue",
            ),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="outcome",
            field=models.CharField(
                blank=True,
                choices=[
                    ("converted", "Convertido"),
                    ("consulting", "Consultoria"),
                    ("deferred", "Não priorizado"),
                    ("rejected", "Recusado"),
                ],
                db_index=True,
                max_length=16,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="outcome_note",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="deferred_until",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="awaiting_info",
            field=models.BooleanField(default=False),
        ),
        # DISCORD as new SourceType value requires no schema change (CharField)
    ]
