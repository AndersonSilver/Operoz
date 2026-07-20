from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0197_board_intake_form_scope"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="boardintakeform",
            name="board_intake_form_unique_name_board_when_deleted_at_null",
        ),
        migrations.AddConstraint(
            model_name="boardintakeform",
            constraint=models.UniqueConstraint(
                condition=models.Q(deleted_at__isnull=True),
                fields=["board", "name", "form_scope"],
                name="board_intake_form_unique_name_board_scope_when_deleted_at_null",
            ),
        ),
    ]
