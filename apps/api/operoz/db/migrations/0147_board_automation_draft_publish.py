# Draft/publish lifecycle for board automation rules

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_published_graph_from_legacy(apps, schema_editor):
    Rule = apps.get_model("db", "BoardAutomationRule")
    for rule in Rule.objects.all().iterator():
        graph = rule.graph or {}
        has_nodes = bool(graph.get("nodes"))
        if rule.enabled and has_nodes:
            rule.published_graph = graph
            rule.published_version = max(rule.published_version or 0, 1)
            if not rule.published_at:
                rule.published_at = rule.updated_at
            rule.save(update_fields=["published_graph", "published_version", "published_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0146_board_automation_enterprise_audit_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="boardautomationrule",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="boardautomationrule",
            name="published_graph",
            field=models.JSONField(default=dict),
        ),
        migrations.AddField(
            model_name="boardautomationrule",
            name="published_version",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.CreateModel(
            name="BoardAutomationRuleRevision",
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
                ("kind", models.CharField(choices=[("draft", "Draft"), ("published", "Published")], max_length=16)),
                ("graph", models.JSONField(default=dict)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True, default="")),
                ("graph_version", models.PositiveSmallIntegerField(default=1)),
                (
                    "board",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="automation_rule_revisions",
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
                    "rule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="revisions",
                        to="db.boardautomationrule",
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
                        related_name="board_automation_revisions",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "board_automation_rule_revisions",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="boardautomationrule",
            index=models.Index(fields=["board", "published_version"], name="board_auto_board_i_pub_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationrulerevision",
            index=models.Index(fields=["rule", "created_at"], name="board_auto_rule_c_idx"),
        ),
        migrations.AddIndex(
            model_name="boardautomationrulerevision",
            index=models.Index(fields=["board", "kind", "created_at"], name="board_auto_board_k_c_idx"),
        ),
        migrations.RunPython(seed_published_graph_from_legacy, migrations.RunPython.noop),
    ]
