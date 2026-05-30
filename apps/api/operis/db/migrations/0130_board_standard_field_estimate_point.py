# Tech4Humans: estimativa como campo padrão configurável por board

from django.db import migrations, models


def seed_estimate_point_standard_field(apps, schema_editor):
    Board = apps.get_model("db", "Board")
    BoardStandardField = apps.get_model("db", "BoardStandardField")
    for board in Board.objects.filter(deleted_at__isnull=True):
        BoardStandardField.objects.get_or_create(
            board_id=board.id,
            field_key="estimate_point",
            defaults={
                "workspace_id": board.workspace_id,
                "sort_order": 6500,
                "is_enabled": True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0129_board_field_form_span"),
    ]

    operations = [
        migrations.AlterField(
            model_name="boardstandardfield",
            name="field_key",
            field=models.CharField(
                choices=[
                    ("priority", "Priority"),
                    ("label_ids", "Labels"),
                    ("start_date", "Start date"),
                    ("target_date", "Due date"),
                    ("cycle_id", "Cycle"),
                    ("module_ids", "Modules"),
                    ("estimate_point", "Estimate"),
                    ("parent_id", "Parent"),
                ],
                max_length=32,
            ),
        ),
        migrations.RunPython(seed_estimate_point_standard_field, migrations.RunPython.noop),
    ]
