# Module.stage passa a referenciar BoardIssueType (tipo de card / etapa unificado)

import django.db.models.deletion
from django.db import migrations, models


def migrate_module_stages_to_board_issue_types(apps, schema_editor):
    Module = apps.get_model("db", "Module")
    BoardModuleStage = apps.get_model("db", "BoardModuleStage")
    BoardIssueType = apps.get_model("db", "BoardIssueType")
    Project = apps.get_model("db", "Project")

    for module in Module.objects.filter(legacy_module_stage_id__isnull=False).iterator():
        try:
            old_stage = BoardModuleStage.objects.get(pk=module.legacy_module_stage_id)
        except BoardModuleStage.DoesNotExist:
            continue

        project = Project.objects.filter(pk=module.project_id).first()
        if not project or not project.board_id:
            continue

        board_issue_type = (
            BoardIssueType.objects.filter(
                board_id=project.board_id,
                deleted_at__isnull=True,
                issue_type__name=old_stage.name,
                issue_type__deleted_at__isnull=True,
            )
            .order_by("sort_order", "created_at")
            .first()
        )
        if board_issue_type:
            module.stage_id = board_issue_type.id
            module.save(update_fields=["stage_id"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0185_merge_module_stage_and_intake_slug"),
    ]

    operations = [
        migrations.RenameField(
            model_name="module",
            old_name="stage",
            new_name="legacy_module_stage",
        ),
        migrations.AddField(
            model_name="module",
            name="stage",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="modules",
                to="db.boardissuetype",
            ),
        ),
        migrations.RunPython(migrate_module_stages_to_board_issue_types, noop_reverse),
        migrations.RemoveField(
            model_name="module",
            name="legacy_module_stage",
        ),
    ]
