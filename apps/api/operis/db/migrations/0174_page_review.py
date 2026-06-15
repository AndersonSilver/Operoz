import operis.db.models.page_review
import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0173_client360_enterprise"),
    ]

    operations = [
        migrations.CreateModel(
            name="PageReviewSession",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
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
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
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
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("sent", "Sent"),
                            ("approved", "Approved"),
                            ("changes_requested", "Changes requested"),
                        ],
                        db_index=True,
                        default="draft",
                        max_length=32,
                    ),
                ),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="review_sessions",
                        to="db.page",
                    ),
                ),
                (
                    "page_version",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="review_sessions",
                        to="db.pageversion",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="page_review_sessions",
                        to="db.project",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="page_review_sessions",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "page_review_sessions",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="PageReviewInvite",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
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
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
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
                ("email", models.EmailField(db_index=True, max_length=255)),
                (
                    "token",
                    models.CharField(
                        db_index=True,
                        default=operis.db.models.page_review.generate_prd_review_invite_token,
                        max_length=128,
                        unique=True,
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("last_access_at", models.DateTimeField(blank=True, null=True)),
                ("access_count", models.PositiveIntegerField(default=0)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="invites",
                        to="db.pagereviewsession",
                    ),
                ),
            ],
            options={
                "db_table": "page_review_invites",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="PageReviewComment",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
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
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
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
                    "comment_type",
                    models.CharField(
                        choices=[("section", "Section"), ("inline", "Inline")],
                        db_index=True,
                        max_length=16,
                    ),
                ),
                ("section_id", models.CharField(max_length=255)),
                ("quote", models.TextField(blank=True, default="")),
                ("anchor", models.JSONField(blank=True, default=dict)),
                ("body", models.TextField()),
                ("author_email", models.EmailField(max_length=255)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        to="db.pagereviewsession",
                    ),
                ),
            ],
            options={
                "db_table": "page_review_comments",
                "ordering": ("created_at",),
            },
        ),
        migrations.CreateModel(
            name="PageReviewEvent",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "created_by",
                    models.ForeignKey(
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
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated_by",
                        to="db.user",
                        verbose_name="Last Modified By",
                    ),
                ),
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
                    "event_type",
                    models.CharField(
                        choices=[
                            ("opened", "Opened"),
                            ("commented", "Commented"),
                            ("approved", "Approved"),
                            ("feedback_submitted", "Feedback submitted"),
                            ("invite_created", "Invite created"),
                            ("session_sent", "Session sent"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("actor_email", models.EmailField(blank=True, default="", max_length=255)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="db.pagereviewsession",
                    ),
                ),
            ],
            options={
                "db_table": "page_review_events",
                "ordering": ("created_at",),
            },
        ),
        migrations.AddIndex(
            model_name="pagereviewsession",
            index=models.Index(fields=["page", "status"], name="page_review_page_id_8a2f1d_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewsession",
            index=models.Index(fields=["workspace", "project"], name="page_review_workspa_4c91ab_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewinvite",
            index=models.Index(fields=["session", "email"], name="page_review_session_2d8e11_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewinvite",
            index=models.Index(fields=["expires_at"], name="page_review_expires_91bc02_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewcomment",
            index=models.Index(fields=["session", "comment_type"], name="page_review_session_7f3ac2_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewcomment",
            index=models.Index(fields=["session", "section_id"], name="page_review_session_1e4b55_idx"),
        ),
        migrations.AddIndex(
            model_name="pagereviewevent",
            index=models.Index(fields=["session", "event_type"], name="page_review_session_9aa0de_idx"),
        ),
    ]
