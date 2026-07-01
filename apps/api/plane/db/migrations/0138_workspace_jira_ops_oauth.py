# Jira OPS OAuth fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0137_workspace_jira_ops_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="oauth_access_token_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="oauth_refresh_token_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="oauth_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="jira_site_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
