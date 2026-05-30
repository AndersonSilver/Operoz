# Generated manually for workspace-scoped issue email notification flags

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0121_alter_estimate_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspace",
            name="issue_notify_assignees_always_email",
            field=models.BooleanField(
                default=False,
                help_text="Assignees receive email for every issue activity (ignores their email toggles for those events).",
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="issue_notify_email_include_extended_activities",
            field=models.BooleanField(
                default=False,
                help_text="Emit issue notifications for module/cycle/reactions/votes/drafts (Plane skips these by default).",
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="issue_notify_email_include_description_changes",
            field=models.BooleanField(
                default=False,
                help_text="Notify subscribers/assignees when issue description changes.",
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="issue_notify_email_dispatch_immediately",
            field=models.BooleanField(
                default=False,
                help_text="Trigger email queue processing right after logging (instead of waiting for the 5-minute beat).",
            ),
        ),
    ]
