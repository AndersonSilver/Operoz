from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0165_client360_health_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardclient360healthsettings",
            name="score_alert_threshold",
            field=models.PositiveSmallIntegerField(default=40),
        ),
    ]
