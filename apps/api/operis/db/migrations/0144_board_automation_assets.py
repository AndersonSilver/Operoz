# Board automation scripts and email templates

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0143_board_automation"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardAutomationScript",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("source_code", models.TextField(default="")),
                ("is_active", models.BooleanField(default=True)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="automation_scripts", to="db.board")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="board_automation_scripts", to="db.workspace")),
            ],
            options={
                "db_table": "board_automation_scripts",
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="BoardAutomationEmailTemplate",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("id", models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("subject", models.CharField(default="", max_length=500)),
                ("html_body", models.TextField(default="")),
                ("is_active", models.BooleanField(default=True)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="automation_email_templates", to="db.board")),
                ("created_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to=settings.AUTH_USER_MODEL, verbose_name="Created By")),
                ("updated_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to=settings.AUTH_USER_MODEL, verbose_name="Last Modified By")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="board_automation_email_templates", to="db.workspace")),
            ],
            options={
                "db_table": "board_automation_email_templates",
                "ordering": ("name",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationscript",
            index=models.Index(fields=["board", "is_active"], name="board_auto_script_board_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationemailtemplate",
            index=models.Index(fields=["board", "is_active"], name="board_auto_email_tpl_board_idx"),
        ),
    ]
