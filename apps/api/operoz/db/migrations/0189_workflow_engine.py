# Generated migration for Workflow Engine

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("db", "0188_support_alert_recipient_config"),
    ]

    operations = [
        # Create Workflow table
        migrations.CreateModel(
            name="Workflow",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflow_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflow_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("is_draft", models.BooleanField(default=True)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("published_version", models.PositiveIntegerField(default=0)),
                ("published_graph", models.JSONField(blank=True, null=True)),
                (
                    "initial_state",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="db.state",
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workflows",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "workflows",
                "verbose_name": "Workflow",
                "verbose_name_plural": "Workflows",
                "indexes": [
                    models.Index(fields=["workspace", "is_active"], name="idx_workflow_workspace_active"),
                    models.Index(fields=["workspace", "is_draft"], name="idx_workflow_workspace_draft"),
                ],
            },
        ),
        
        # Create WorkflowTransition table
        migrations.CreateModel(
            name="WorkflowTransition",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowtransition_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowtransition_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("name", models.CharField(max_length=120)),
                ("is_global", models.BooleanField(default=False)),
                ("sort_order", models.FloatField(default=10000)),
                (
                    "from_state",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.state",
                    ),
                ),
                (
                    "to_state",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.state",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transitions",
                        to="db.workflow",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_transitions",
                "verbose_name": "Workflow Transition",
                "verbose_name_plural": "Workflow Transitions",
                "indexes": [
                    models.Index(fields=["workflow", "from_state"], name="idx_transition_workflow_from_state"),
                    models.Index(fields=["workflow", "is_global"], name="idx_transition_workflow_global"),
                ],
            },
        ),
        
        # Create TransitionCondition table
        migrations.CreateModel(
            name="TransitionCondition",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitioncondition_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitioncondition_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("condition_type", models.CharField(max_length=40)),
                ("config", models.JSONField(default=dict)),
                (
                    "transition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conditions",
                        to="db.workflowtransition",
                    ),
                ),
            ],
            options={
                "db_table": "transition_conditions",
                "verbose_name": "Transition Condition",
                "verbose_name_plural": "Transition Conditions",
            },
        ),
        
        # Create TransitionValidator table
        migrations.CreateModel(
            name="TransitionValidator",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionvalidator_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionvalidator_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("validator_type", models.CharField(max_length=40)),
                ("config", models.JSONField(default=dict)),
                (
                    "transition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="validators",
                        to="db.workflowtransition",
                    ),
                ),
            ],
            options={
                "db_table": "transition_validators",
                "verbose_name": "Transition Validator",
                "verbose_name_plural": "Transition Validators",
            },
        ),
        
        # Create TransitionPostFunction table
        migrations.CreateModel(
            name="TransitionPostFunction",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionpostfunction_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionpostfunction_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("function_type", models.CharField(max_length=40)),
                ("config", models.JSONField(default=dict)),
                ("sort_order", models.FloatField(default=10000)),
                (
                    "transition",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="post_functions",
                        to="db.workflowtransition",
                    ),
                ),
            ],
            options={
                "db_table": "transition_post_functions",
                "verbose_name": "Transition Post Function",
                "verbose_name_plural": "Transition Post Functions",
            },
        ),
        
        # Create TransitionScreen table
        migrations.CreateModel(
            name="TransitionScreen",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionscreen_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="transitionscreen_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("fields", models.JSONField(default=list)),
                (
                    "transition",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="screen",
                        to="db.workflowtransition",
                    ),
                ),
            ],
            options={
                "db_table": "transition_screens",
                "verbose_name": "Transition Screen",
                "verbose_name_plural": "Transition Screens",
            },
        ),
        
        # Create WorkflowScheme table
        migrations.CreateModel(
            name="WorkflowScheme",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowscheme_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowscheme_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                ("name", models.CharField(max_length=255)),
                ("is_default", models.BooleanField(default=False)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workflow_schemes",
                        to="db.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_schemes",
                "verbose_name": "Workflow Scheme",
                "verbose_name_plural": "Workflow Schemes",
            },
        ),
        
        # Create WorkflowSchemeEntry table
        migrations.CreateModel(
            name="WorkflowSchemeEntry",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                        unique=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Created At")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="Last Modified At")),
                ("created_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowschemeentry_created_by",
                    verbose_name="Created By",
                    to="db.user",
                )),
                ("updated_by", models.ForeignKey(
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True,
                    related_name="workflowschemeentry_updated_by",
                    verbose_name="Last Modified By",
                    to="db.user",
                )),
                ("deleted_at", models.DateTimeField(blank=True, null=True, verbose_name="Deleted At")),
                (
                    "issue_type",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="+",
                        to="db.issuetype",
                    ),
                ),
                (
                    "scheme",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="entries",
                        to="db.workflowscheme",
                    ),
                ),
                (
                    "workflow",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="+",
                        to="db.workflow",
                    ),
                ),
            ],
            options={
                "db_table": "workflow_scheme_entries",
                "verbose_name": "Workflow Scheme Entry",
                "verbose_name_plural": "Workflow Scheme Entries",
            },
        ),
        
        # Add unique constraint for Workflow
        migrations.AddConstraint(
            model_name="workflow",
            constraint=models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_workflow_workspace_name",
            ),
        ),
        
        # Add unique constraint for WorkflowSchemeEntry
        migrations.AddConstraint(
            model_name="workflowschemeentry",
            constraint=models.UniqueConstraint(
                fields=["scheme", "issue_type"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_scheme_issue_type",
            ),
        ),
        
        # Add workflow_scheme FK to Project model
        migrations.AddField(
            model_name="project",
            name="workflow_scheme",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="projects",
                to="db.workflowscheme",
            ),
        ),
    ]
