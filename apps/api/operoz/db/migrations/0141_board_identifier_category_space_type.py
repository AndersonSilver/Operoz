# Tech4Humans: Jira-like space directory fields

from django.db import migrations, models
from django.utils.text import slugify


def backfill_board_identifiers(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    for board in Board.objects.filter(deleted_at__isnull=True):
        if board.identifier:
            continue
        base = slugify(board.slug or board.name).replace("-", "").upper()
        if not base:
            continue
        candidate = base[:12]
        suffix = 1
        while (
            Board.objects.filter(workspace_id=board.workspace_id, identifier=candidate, deleted_at__isnull=True)
            .exclude(pk=board.pk)
            .exists()
        ):
            suffix += 1
            candidate = f"{base[: max(1, 12 - len(str(suffix)))]}{suffix}"[:12]
        board.identifier = candidate
        board.save(update_fields=["identifier"])


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0140_workspace_jira_ops_audit_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="board",
            name="identifier",
            field=models.CharField(blank=True, db_index=True, default="", max_length=12, verbose_name="Space Key"),
        ),
        migrations.AddField(
            model_name="board",
            name="category",
            field=models.CharField(blank=True, default="", max_length=128, verbose_name="Category"),
        ),
        migrations.AddField(
            model_name="board",
            name="space_type",
            field=models.CharField(
                default="team_managed",
                max_length=64,
                verbose_name="Space Type",
            ),
        ),
        migrations.AddConstraint(
            model_name="board",
            constraint=models.UniqueConstraint(
                fields=["workspace", "identifier"],
                condition=models.Q(deleted_at__isnull=True) & ~models.Q(identifier=""),
                name="board_unique_identifier_workspace_when_deleted_at_null",
            ),
        ),
        migrations.RunPython(backfill_board_identifiers, migrations.RunPython.noop),
    ]
