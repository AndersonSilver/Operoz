from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0196_intake_outcome_and_convert"),
    ]

    operations = [
        migrations.AddField(
            model_name="boardintakeform",
            name="form_scope",
            field=models.CharField(
                max_length=16,
                choices=[("support", "Support"), ("demand", "Demand")],
                default="support",
            ),
        ),
    ]
