from django.db import migrations, models

DEFAULT_FEATURES = {
    "cycle_view": True,
    "module_view": True,
    "issue_views_view": True,
    "page_view": True,
    "intake_view": True,
}


def enable_features_for_all_projects(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    Project.objects.all().update(**DEFAULT_FEATURES)


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0179_enable_operi_intake_view"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="cycle_view",
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="issue_views_view",
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="module_view",
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="intake_view",
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(enable_features_for_all_projects, migrations.RunPython.noop),
    ]
