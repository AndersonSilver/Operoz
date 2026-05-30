# Generated manually for Tech4Humans board standard fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


STANDARD_FIELD_DEFAULTS = [
    ("priority", 1000),
    ("label_ids", 2000),
    ("start_date", 3000),
    ("target_date", 4000),
    ("cycle_id", 5000),
    ("module_ids", 6000),
    ("parent_id", 7000),
]


def seed_board_standard_fields(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    BoardStandardField = apps.get_model("db", "BoardStandardField")
    for board in Board.objects.filter(deleted_at__isnull=True):
        for field_key, sort_order in STANDARD_FIELD_DEFAULTS:
            BoardStandardField.objects.get_or_create(
                board_id=board.id,
                field_key=field_key,
                defaults={
                    "workspace_id": board.workspace_id,
                    "sort_order": sort_order,
                    "is_enabled": True,
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0125_board_custom_field"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardStandardField",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "id",
                    models.UUIDField(
                        db_index=True,
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                (
                    "field_key",
                    models.CharField(
                        choices=[
                            ("priority", "Priority"),
                            ("label_ids", "Labels"),
                            ("start_date", "Start date"),
                            ("target_date", "Due date"),
                            ("cycle_id", "Cycle"),
                            ("module_ids", "Modules"),
                            ("parent_id", "Parent"),
                        ],
                        max_length=32,
                    ),
                ),
                ("sort_order", models.FloatField(default=65535)),
                ("is_enabled", models.BooleanField(default=True)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_standard_fields",
                        to="db.board",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last Modified By",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="board_standard_fields",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "verbose_name": "Board Standard Field",
                "verbose_name_plural": "Board Standard Fields",
                "db_table": "board_standard_fields",
                "ordering": ("sort_order", "field_key"),
            },
        ),
        migrations.AddConstraint(
            model_name="boardstandardfield",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("board", "field_key"),
                name="board_standard_field_unique_board_key_when_deleted_at_null",
            ),
        ),
        migrations.RunPython(seed_board_standard_fields, migrations.RunPython.noop),
    ]
