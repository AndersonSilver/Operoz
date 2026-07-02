from django.db import migrations
from django.db.models import Q


def backfill_default_project_intakes(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    Intake = apps.get_model("db", "Intake")

    projects = Project.objects.filter(deleted_at__isnull=True).filter(
        Q(intake_view=True) | Q(support_view=True)
    )

    for project in projects.iterator():
        has_intake = Intake.objects.filter(project_id=project.id, deleted_at__isnull=True).exists()
        if has_intake:
            continue

        Intake.objects.create(
            name=f"{project.name} Intake",
            project_id=project.id,
            workspace_id=project.workspace_id,
            is_default=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0192_module_gantt_bar_color"),
    ]

    operations = [
        migrations.RunPython(backfill_default_project_intakes, migrations.RunPython.noop),
    ]
