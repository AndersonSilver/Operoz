# Create a default (empty) workflow scheme per workspace for admin configuration.

from django.db import migrations


def create_default_workflow_schemes(apps, schema_editor):
    WorkSpace = apps.get_model("db", "Workspace")
    WorkflowScheme = apps.get_model("db", "WorkflowScheme")

    for workspace in WorkSpace.objects.filter(deleted_at__isnull=True):
        has_default = WorkflowScheme.objects.filter(
            workspace=workspace,
            is_default=True,
            deleted_at__isnull=True,
        ).exists()
        if has_default:
            continue
        WorkflowScheme.objects.create(
            workspace=workspace,
            name="Default",
            is_default=True,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0189_workflow_engine"),
    ]

    operations = [
        migrations.RunPython(create_default_workflow_schemes, migrations.RunPython.noop),
    ]
