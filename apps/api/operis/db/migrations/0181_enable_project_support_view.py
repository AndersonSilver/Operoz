from django.db import migrations, models


def enable_support_view_for_all_projects(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    Project.objects.all().update(support_view=True)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0180_project_default_features_enabled"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="support_view",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(enable_support_view_for_all_projects, migrations.RunPython.noop),
    ]
