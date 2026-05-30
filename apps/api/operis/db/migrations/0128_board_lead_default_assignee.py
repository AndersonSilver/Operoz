# Tech4Humans: board owner (lead) and default assignee on Board

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0127_alter_workspacecustomfield_field_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="board",
            name="board_lead",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="board_lead_boards",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="board",
            name="default_assignee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="board_default_assignee_boards",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
