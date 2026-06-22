from django.db import migrations, models
import django.db.models.deletion
import uuid


def seed_default_support_queues(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    BoardSupportQueue = apps.get_model("db", "BoardSupportQueue")
    for board in Board.objects.filter(deleted_at__isnull=True).iterator():
        if BoardSupportQueue.objects.filter(board_id=board.id, deleted_at__isnull=True).exists():
            continue
        BoardSupportQueue.objects.create(
            id=uuid.uuid4(),
            workspace_id=board.workspace_id,
            board_id=board.id,
            name="Geral",
            slug="geral",
            color="#6366F1",
            sort_order=0,
            is_default=True,
            description="Fila padrão de sustentação",
        )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0175_board_intake_form"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardSupportQueue",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=100)),
                ("color", models.CharField(default="#6366F1", max_length=32)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_default", models.BooleanField(default=False)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="support_queues", to="db.board"
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to="db.user",
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_support_queues",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "BoardSupportQueue",
                "verbose_name_plural": "BoardSupportQueues",
                "db_table": "board_support_queues",
                "ordering": ("sort_order", "name"),
            },
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="support_queue",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="intake_issues",
                to="db.boardsupportqueue",
            ),
        ),
        migrations.AddIndex(
            model_name="boardsupportqueue",
            index=models.Index(fields=["board", "sort_order"], name="board_supp_queue_board_sort_idx"),
        ),
        migrations.AddIndex(
            model_name="boardsupportqueue",
            index=models.Index(fields=["workspace", "board"], name="board_supp_queue_ws_board_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardsupportqueue",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("board", "slug"),
                name="board_support_queue_unique_slug_board_when_deleted_at_null",
            ),
        ),
        migrations.RunPython(seed_default_support_queues, migrations.RunPython.noop),
    ]
