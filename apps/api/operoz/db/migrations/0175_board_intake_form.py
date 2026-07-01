import operoz.db.models.board_intake_form
import uuid
import django.db.models.deletion
from django.db import migrations, models


CLIENT_FIELD = {
    "id": "field-client",
    "field_type": "client",
    "label": "Cliente",
    "help_text": "",
    "required": True,
    "form_span": "full",
    "maps_to": "project_id",
}


def migrate_project_intake_forms_to_board(apps, schema_editor):
    BoardIntakeForm = apps.get_model("db", "BoardIntakeForm")
    IntakeForm = apps.get_model("db", "IntakeForm")
    Project = apps.get_model("db", "Project")

    grouped: dict[tuple, list] = {}
    for project_form in IntakeForm.objects.filter(deleted_at__isnull=True).iterator():
        project = Project.objects.filter(pk=project_form.project_id).only("board_id", "workspace_id").first()
        if project is None or not project.board_id:
            continue
        key = (project.board_id, project_form.name)
        grouped.setdefault(key, []).append(project_form)

    for (board_id, name), project_forms in grouped.items():
        if BoardIntakeForm.objects.filter(board_id=board_id, name=name, deleted_at__isnull=True).exists():
            continue

        template = next((item for item in project_forms if item.is_published), project_forms[0])
        fields = list(template.fields or [])
        if not any(field.get("field_type") == "client" for field in fields):
            fields = [CLIENT_FIELD, *fields]

        BoardIntakeForm.objects.create(
            workspace_id=template.workspace_id,
            board_id=board_id,
            name=name,
            description=template.description or "",
            header_title=template.header_title or "",
            anchor=template.anchor,
            is_published=any(item.is_published for item in project_forms),
            fields=fields,
            defaults=template.defaults or {},
            submit_message=template.submit_message or "",
            require_auth=template.require_auth,
            theme="default",
        )

    IntakeForm.objects.filter(project__board_id__isnull=False, deleted_at__isnull=True).update(is_published=False)


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0174_page_review"),
    ]

    operations = [
        migrations.CreateModel(
            name="BoardIntakeForm",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_created_by", to="db.user", verbose_name="Created By")),
                ("updated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="%(class)s_updated_by", to="db.user", verbose_name="Last Modified By")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("header_title", models.CharField(blank=True, default="", max_length=255)),
                ("anchor", models.CharField(db_index=True, default=operoz.db.models.board_intake_form.get_board_intake_form_anchor, max_length=255, unique=True)),
                ("is_published", models.BooleanField(default=False)),
                ("fields", models.JSONField(default=operoz.db.models.board_intake_form.default_board_intake_form_fields)),
                ("defaults", models.JSONField(blank=True, default=dict)),
                ("submit_message", models.TextField(blank=True, default="")),
                ("require_auth", models.BooleanField(default=False)),
                ("theme", models.CharField(choices=[("default", "Default"), ("minimal", "Minimal"), ("support", "Support"), ("incident", "Incident")], default="default", max_length=32)),
                ("board", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="intake_forms", to="db.board")),
                ("workspace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="board_intake_forms", to="db.workspace")),
            ],
            options={
                "verbose_name": "BoardIntakeForm",
                "verbose_name_plural": "BoardIntakeForms",
                "db_table": "board_intake_forms",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddField(
            model_name="intakeissue",
            name="board_intake_form",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="submissions", to="db.boardintakeform"),
        ),
        migrations.AddIndex(
            model_name="boardintakeform",
            index=models.Index(fields=["board", "is_published"], name="board_intake_board_pub_idx"),
        ),
        migrations.AddIndex(
            model_name="boardintakeform",
            index=models.Index(fields=["workspace", "board"], name="board_intake_ws_board_idx"),
        ),
        migrations.AddConstraint(
            model_name="boardintakeform",
            constraint=models.UniqueConstraint(condition=models.Q(("deleted_at__isnull", True)), fields=("board", "name"), name="board_intake_form_unique_name_board_when_deleted_at_null"),
        ),
        migrations.RunPython(migrate_project_intake_forms_to_board, migrations.RunPython.noop),
    ]
