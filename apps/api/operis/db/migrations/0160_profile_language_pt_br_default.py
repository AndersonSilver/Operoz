from django.db import migrations, models


def migrate_profile_language_to_pt_br(apps, schema_editor):
    Profile = apps.get_model("db", "Profile")
    Profile.objects.filter(language="en").update(language="pt-BR")


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0159_assistant_quality_audit"),
    ]

    operations = [
        migrations.RunPython(migrate_profile_language_to_pt_br, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="profile",
            name="language",
            field=models.CharField(default="pt-BR", max_length=255),
        ),
    ]
