from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0148_intake_form"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardautomationrule",
            name="schedule_last_slot",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
    ]
