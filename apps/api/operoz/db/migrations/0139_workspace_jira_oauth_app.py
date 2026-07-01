from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0138_workspace_jira_ops_oauth"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="oauth_app_client_id",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="workspacejiraopsconfig",
            name="oauth_app_client_secret_encrypted",
            field=models.TextField(blank=True, default=""),
        ),
    ]
