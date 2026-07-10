from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0194_workspace_integration_flags"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="state_changed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
