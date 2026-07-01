import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0156_assistant_security"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AssistantQualityDaily",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                ("quality_date", models.DateField()),
                ("response_count", models.PositiveIntegerField(default=0)),
                ("tool_response_count", models.PositiveIntegerField(default=0)),
                ("feedback_up", models.PositiveIntegerField(default=0)),
                ("feedback_down", models.PositiveIntegerField(default=0)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_quality_daily",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_quality_daily",
                "ordering": ("-quality_date",),
            },
        ),
        migrations.CreateModel(
            name="AssistantQualityReview",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
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
                    "verdict",
                    models.CharField(
                        choices=[
                            ("ok", "Ok"),
                            ("hallucination", "Hallucination"),
                            ("incomplete", "Incomplete"),
                            ("unsafe", "Unsafe"),
                        ],
                        max_length=32,
                    ),
                ),
                ("notes", models.TextField(blank=True, default="")),
                (
                    "message",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quality_reviews",
                        to="db.assistantmessage",
                    ),
                ),
                (
                    "reviewer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_quality_reviews",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assistant_quality_reviews",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "assistant_quality_reviews",
                "ordering": ("-created_at",),
            },
        ),
        migrations.AddConstraint(
            model_name="assistantqualitydaily",
            constraint=models.UniqueConstraint(
                fields=("workspace", "quality_date"),
                name="assistant_quality_ws_date_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="assistantqualityreview",
            index=models.Index(fields=["workspace", "-created_at"], name="asst_qreview_ws_idx"),
        ),
    ]
