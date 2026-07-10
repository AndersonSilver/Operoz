from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0193_backfill_default_project_intakes"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspace",
            name="is_google_calendar_enabled",
            field=models.BooleanField(
                default=False,
                help_text="Allow workspace members to connect Google Calendar for alert notifications.",
            ),
        ),
        migrations.AddField(
            model_name="workspace",
            name="is_discord_dm_enabled",
            field=models.BooleanField(
                default=False,
                help_text="Allow workspace members to connect Discord DM for alert notifications.",
            ),
        ),
    ]
