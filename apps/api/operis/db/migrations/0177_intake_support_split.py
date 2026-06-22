from django.db import migrations, models


def forwards(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    IntakeIssue = apps.get_model("db", "IntakeIssue")

    Project.objects.filter(intake_view=True).update(support_view=True, intake_view=False)

    IntakeIssue.objects.filter(board_intake_form_id__isnull=False).update(ticket_kind="support")
    IntakeIssue.objects.filter(board_intake_form_id__isnull=True, intake_form_id__isnull=False).update(
        ticket_kind="intake"
    )
    IntakeIssue.objects.exclude(ticket_kind__in=["intake", "support"]).update(ticket_kind="support")


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0176_board_support_queue"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="support_view",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="ticket_kind",
            field=models.CharField(
                choices=[("intake", "Intake"), ("support", "Support")],
                db_index=True,
                default="support",
                max_length=16,
            ),
        ),
        migrations.RunPython(forwards, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name="intakeissue",
            index=models.Index(fields=["project", "ticket_kind", "status"], name="intake_issue_kind_status_idx"),
        ),
    ]
