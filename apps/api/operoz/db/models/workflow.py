# Django imports
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel
from operoz.db.mixins import SoftDeletionManager


class WorkflowManager(SoftDeletionManager):
    """Manager for Workflow models"""
    
    def get_queryset(self):
        return super().get_queryset().select_related("workspace", "initial_state")


class Workflow(BaseModel):
    """Workflow model for defining state transition rules"""
    
    workspace = models.ForeignKey(
        "db.WorkSpace",
        on_delete=models.CASCADE,
        related_name="workflows"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_draft = models.BooleanField(default=True)
    initial_state = models.ForeignKey(
        "db.State",
        on_delete=models.SET_NULL,
        null=True,
        related_name="+"
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_version = models.PositiveIntegerField(default=0)
    published_graph = models.JSONField(null=True, blank=True)  # Snapshot of published graph
    draft_graph = models.JSONField(null=True, blank=True)  # Editor layout (node positions, edge styling)

    objects = WorkflowManager()

    class Meta:
        db_table = "workflows"
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=Q(deleted_at__isnull=True),
                name="uq_workflow_workspace_name"
            ),
        ]
        indexes = [
            models.Index(fields=["workspace", "is_active"]),
            models.Index(fields=["workspace", "is_draft"]),
        ]
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"

    def __str__(self):
        return f"{self.name} <{self.workspace.slug}>"


class WorkflowTransitionManager(SoftDeletionManager):
    """Manager for WorkflowTransition models"""
    
    def get_queryset(self):
        return super().get_queryset().select_related(
            "workflow",
            "from_state",
            "to_state"
        ).prefetch_related(
            "conditions",
            "validators",
            "post_functions"
        )


class WorkflowTransition(BaseModel):
    """Transition between states in a workflow"""
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="transitions"
    )
    from_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        null=True,
        related_name="+"  # null = global transition
    )
    to_state = models.ForeignKey(
        "db.State",
        on_delete=models.CASCADE,
        related_name="+"
    )
    name = models.CharField(max_length=120)  # "Start Progress", "Close"
    is_global = models.BooleanField(default=False)  # Available from any state
    sort_order = models.FloatField(default=10000)

    objects = WorkflowTransitionManager()

    class Meta:
        db_table = "workflow_transitions"
        indexes = [
            models.Index(fields=["workflow", "from_state"]),
            models.Index(fields=["workflow", "is_global"]),
        ]
        verbose_name = "Workflow Transition"
        verbose_name_plural = "Workflow Transitions"

    def __str__(self):
        from_state_name = self.from_state.name if self.from_state else "Any"
        return f"{self.name}: {from_state_name} → {self.to_state.name}"


class TransitionCondition(BaseModel):
    """Condition that must be met for a transition to be available"""
    
    transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="conditions"
    )
    condition_type = models.CharField(max_length=40)  # role/assignee_only/reporter_only/group
    config = models.JSONField(default=dict)

    class Meta:
        db_table = "transition_conditions"
        verbose_name = "Transition Condition"
        verbose_name_plural = "Transition Conditions"

    def __str__(self):
        return f"{self.condition_type} for {self.transition}"


class TransitionValidator(BaseModel):
    """Validator that checks if transition can be executed"""
    
    transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="validators"
    )
    validator_type = models.CharField(max_length=40)  # required_fields/has_comment/regex
    config = models.JSONField(default=dict)

    class Meta:
        db_table = "transition_validators"
        verbose_name = "Transition Validator"
        verbose_name_plural = "Transition Validators"

    def __str__(self):
        return f"{self.validator_type} for {self.transition}"


class TransitionPostFunction(BaseModel):
    """Post-function that executes after a successful transition"""
    
    transition = models.ForeignKey(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="post_functions"
    )
    function_type = models.CharField(max_length=40)  # assign/clear_field/update_field/fire_event/webhook
    config = models.JSONField(default=dict)
    sort_order = models.FloatField(default=10000)

    class Meta:
        db_table = "transition_post_functions"
        verbose_name = "Transition Post Function"
        verbose_name_plural = "Transition Post Functions"

    def __str__(self):
        return f"{self.function_type} for {self.transition}"


class TransitionScreen(BaseModel):
    """Screen configuration for transition (fields to show/require)"""
    
    transition = models.OneToOneField(
        WorkflowTransition,
        on_delete=models.CASCADE,
        related_name="screen"
    )
    fields = models.JSONField(default=list)  # [{field_id, required}]

    class Meta:
        db_table = "transition_screens"
        verbose_name = "Transition Screen"
        verbose_name_plural = "Transition Screens"

    def __str__(self):
        return f"Screen for {self.transition}"


class WorkflowSchemeManager(SoftDeletionManager):
    """Manager for WorkflowScheme models"""
    
    def get_queryset(self):
        return super().get_queryset().select_related("workspace").prefetch_related("entries")


class WorkflowScheme(BaseModel):
    """Scheme that maps issue types to workflows"""
    
    workspace = models.ForeignKey(
        "db.WorkSpace",
        on_delete=models.CASCADE,
        related_name="workflow_schemes"
    )
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)

    objects = WorkflowSchemeManager()

    class Meta:
        db_table = "workflow_schemes"
        verbose_name = "Workflow Scheme"
        verbose_name_plural = "Workflow Schemes"

    def __str__(self):
        return f"{self.name} <{self.workspace.slug}>"


class WorkflowSchemeEntryManager(SoftDeletionManager):
    """Manager for WorkflowSchemeEntry models"""
    
    def get_queryset(self):
        return super().get_queryset().select_related("scheme", "issue_type", "workflow")


class WorkflowSchemeEntry(BaseModel):
    """Entry mapping an issue type to a workflow in a scheme"""
    
    scheme = models.ForeignKey(
        WorkflowScheme,
        on_delete=models.CASCADE,
        related_name="entries"
    )
    issue_type = models.ForeignKey(
        "db.IssueType",
        on_delete=models.CASCADE,
        null=True,
        related_name="+"  # null = default for all types
    )
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.PROTECT,
        related_name="+"
    )

    objects = WorkflowSchemeEntryManager()

    class Meta:
        db_table = "workflow_scheme_entries"
        constraints = [
            models.UniqueConstraint(
                fields=["scheme", "issue_type"],
                condition=Q(deleted_at__isnull=True),
                name="uq_scheme_issue_type"
            ),
        ]
        verbose_name = "Workflow Scheme Entry"
        verbose_name_plural = "Workflow Scheme Entries"

    def __str__(self):
        issue_type_name = self.issue_type.name if self.issue_type else "Default"
        return f"{issue_type_name} → {self.workflow.name}"
