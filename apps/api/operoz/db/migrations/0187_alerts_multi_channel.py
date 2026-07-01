# Generated manually for Feature 13 — Multi-Channel Alerts

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0186_module_stage_from_board_issue_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="usernotificationpreference",
            name="channels",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="due_date_alert",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="issue_created_alert",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="missing_due_date_alert",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="quiet_hours_end",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="quiet_hours_start",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usernotificationpreference",
            name="quiet_hours_timezone",
            field=models.CharField(default="UTC", max_length=50),
        ),
        migrations.CreateModel(
            name="AlertRule",
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
                    "alert_type",
                    models.CharField(
                        choices=[
                            ("issue_created", "Issue Created"),
                            ("due_date_approaching", "Due Date Approaching"),
                            ("due_date_overdue", "Due Date Overdue"),
                            ("missing_due_date", "Missing Due Date"),
                            ("state_change", "State Change"),
                            ("assignee_change", "Assignee Change"),
                            ("support_ticket_created", "Support Ticket Created"),
                            ("support_ticket_accepted", "Support Ticket Accepted"),
                            ("support_sla_approaching", "Support SLA Approaching"),
                            ("support_sla_breached", "Support SLA Breached"),
                            ("support_ticket_closed", "Support Ticket Closed"),
                        ],
                        max_length=40,
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=200)),
                ("enabled", models.BooleanField(default=True)),
                ("config", models.JSONField(default=dict)),
                ("channels", models.JSONField(default=list)),
                ("escalation_schedule", models.JSONField(default=list)),
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
                    "project",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="alert_rules",
                        to="db.project",
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
                        related_name="alert_rules",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "alert_rules",
                "ordering": ("alert_type", "created_at"),
            },
        ),
        migrations.CreateModel(
            name="UserAlertPreference",
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
                ("alert_type", models.CharField(max_length=40)),
                ("channel_type", models.CharField(max_length=20)),
                ("enabled", models.BooleanField(default=True)),
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
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="alert_preferences",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_alert_preferences",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "user_alert_preferences",
            },
        ),
        migrations.CreateModel(
            name="UserExternalAccount",
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
                    "provider",
                    models.CharField(
                        choices=[("discord", "Discord"), ("google_calendar", "Google Calendar")],
                        max_length=30,
                    ),
                ),
                ("external_id", models.CharField(max_length=255)),
                ("token_data", models.JSONField(blank=True, null=True)),
                ("metadata", models.JSONField(default=dict)),
                ("is_active", models.BooleanField(default=True)),
                ("last_synced_at", models.DateTimeField(blank=True, null=True)),
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
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="external_accounts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="external_accounts",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "user_external_accounts",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="AlertLog",
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
                ("channel", models.CharField(max_length=20)),
                ("alert_type", models.CharField(max_length=40)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                            ("throttled", "Throttled"),
                            ("skipped", "Skipped"),
                        ],
                        default="sent",
                        max_length=20,
                    ),
                ),
                ("data", models.JSONField(default=dict)),
                ("error", models.TextField(blank=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                (
                    "alert_rule",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="logs",
                        to="db.alertrule",
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
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="alert_logs",
                        to="db.issue",
                    ),
                ),
                (
                    "receiver",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="received_alert_logs",
                        to=settings.AUTH_USER_MODEL,
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
                        related_name="alert_logs",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "alert_logs",
                "ordering": ("-created_at",),
            },
        ),
        migrations.CreateModel(
            name="GoogleCalendarEvent",
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
                ("google_event_id", models.CharField(max_length=255)),
                ("calendar_id", models.CharField(default="primary", max_length=255)),
                ("last_synced_at", models.DateTimeField(auto_now=True)),
                (
                    "sync_status",
                    models.CharField(
                        choices=[("synced", "Synced"), ("error", "Error"), ("deleted", "Deleted")],
                        default="synced",
                        max_length=20,
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
                    "issue",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="calendar_events",
                        to="db.issue",
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
                    "user_external_account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="calendar_events",
                        to="db.userexternalaccount",
                    ),
                ),
            ],
            options={
                "db_table": "google_calendar_events",
            },
        ),
        migrations.AddIndex(
            model_name="alertrule",
            index=models.Index(fields=["workspace", "enabled"], name="alert_rules_workspa_idx"),
        ),
        migrations.AddConstraint(
            model_name="alertrule",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("workspace", "project", "alert_type"),
                name="uq_alert_rule_workspace_project_type",
            ),
        ),
        migrations.AddConstraint(
            model_name="useralertpreference",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("user", "workspace", "alert_type", "channel_type"),
                name="uq_user_alert_pref",
            ),
        ),
        migrations.AddConstraint(
            model_name="userexternalaccount",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("user", "workspace", "provider"),
                name="uq_user_external_account",
            ),
        ),
        migrations.AddIndex(
            model_name="alertlog",
            index=models.Index(fields=["issue", "alert_type", "channel"], name="alert_logs_issue_a_idx"),
        ),
        migrations.AddIndex(
            model_name="alertlog",
            index=models.Index(fields=["receiver", "created_at"], name="alert_logs_receive_idx"),
        ),
        migrations.AddIndex(
            model_name="alertlog",
            index=models.Index(fields=["workspace", "alert_type", "created_at"], name="alert_logs_workspa_idx"),
        ),
        migrations.AddIndex(
            model_name="alertlog",
            index=models.Index(
                fields=["receiver", "issue", "alert_type", "channel"],
                name="alert_log_dedup_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="googlecalendarevent",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("issue", "user_external_account"),
                name="uq_gcal_event_issue_account",
            ),
        ),
    ]
