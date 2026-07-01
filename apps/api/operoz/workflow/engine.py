"""
Workflow Engine - Core execution logic

Orchestrates the execution of a workflow transition:
1. Check conditions
2. Run validators
3. Change state
4. Record activity
5. Run post-functions
"""

import time
from typing import Dict, Any, Optional
from django.db import transaction, models
from django.contrib.auth import get_user_model

from operoz.db.models import Issue, IssueActivity, Workflow, WorkflowTransition
from .conditions import check_conditions
from .validators import run_validators
from .post_functions import run_post_functions

User = get_user_model()


class WorkflowExecutionError(Exception):
    """Base exception for workflow execution errors"""
    pass


class ConditionNotSatisfiedError(WorkflowExecutionError):
    """Raised when transition conditions are not met"""
    pass


class ValidationError(WorkflowExecutionError):
    """Raised when transition validators fail"""
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(", ".join(errors))


class ConcurrentStateChangeError(WorkflowExecutionError):
    """Raised when issue state changed during execution (optimistic lock)"""
    pass


def execute_transition(
    issue: Issue,
    transition: WorkflowTransition,
    actor: User,
    data: Optional[Dict[str, Any]] = None
) -> Issue:
    """
    Execute a workflow transition on an issue.
    
    Args:
        issue: The issue to transition
        transition: The transition to execute
        actor: The user executing the transition
        data: Optional data for validators (fields, comment, etc.)
    
    Returns:
        The updated issue
    
    Raises:
        ConditionNotSatisfiedError: If conditions are not met
        ValidationError: If validators fail
        ConcurrentStateChangeError: If issue state changed during execution
    """
    if data is None:
        data = {}
    
    # Store current state for optimistic locking
    current_state_id = issue.state_id
    
    try:
        with transaction.atomic():
            # Step 1: Check conditions
            allowed, error_msg = check_conditions(actor, issue, transition)
            if not allowed:
                raise ConditionNotSatisfiedError(error_msg)
            
            # Step 2: Run validators
            validation_errors = run_validators(issue, data, transition)
            if validation_errors:
                raise ValidationError(validation_errors)
            
            # Step 3: Optimistic lock - check state hasn't changed
            issue.refresh_from_db(fields=["state_id"])
            if issue.state_id != current_state_id:
                raise ConcurrentStateChangeError(
                    "Issue state changed during transition execution"
                )
            
            # Step 4: Change state
            from_state = issue.state
            to_state = transition.to_state
            
            issue.state = to_state
            issue.save(update_fields=["state"])
            
            # Step 5: Record activity (same shape as issue_activities_task state tracking)
            comment = data.get("comment", "")
            IssueActivity.objects.create(
                issue_id=issue.id,
                project_id=issue.project_id,
                workspace_id=issue.workspace_id,
                actor=actor,
                verb="updated",
                field="state",
                old_value=str(from_state.name) if from_state else "",
                new_value=str(to_state.name),
                comment=comment or f"transitioned via {transition.name}",
                old_identifier=from_state.id if from_state else None,
                new_identifier=to_state.id,
                epoch=time.time(),
            )
            
            # Step 6: Run post-functions
            run_post_functions(issue, actor, transition)
            
            return issue
    
    except (ConditionNotSatisfiedError, ValidationError, ConcurrentStateChangeError):
        raise
    except Exception as e:
        # Wrap unexpected exceptions
        raise WorkflowExecutionError(f"Unexpected error during transition execution: {e}")


def resolve_issue_workflow(issue: Issue) -> Workflow | None:
    """Resolve the workflow for an issue via the project's scheme (explicit assignment only)."""
    from operoz.db.models import WorkflowSchemeEntry

    scheme = issue.project.workflow_scheme
    if not scheme:
        return None

    workflow_entry = WorkflowSchemeEntry.objects.filter(
        scheme=scheme,
        issue_type=issue.type,
    ).first()

    if not workflow_entry:
        workflow_entry = WorkflowSchemeEntry.objects.filter(
            scheme=scheme,
            issue_type__isnull=True,
        ).first()

    if not workflow_entry:
        return None

    return workflow_entry.workflow


def get_available_transitions(issue: Issue, user: User) -> list[WorkflowTransition]:
    """
    Get all transitions available to a user for a given issue.
    
    This includes:
    - Transitions from the current state
    - Global transitions (from_state is null)
    - Filtered by conditions the user satisfies
    
    Args:
        issue: The issue to get transitions for
        user: The user to check conditions against
    
    Returns:
        List of available WorkflowTransition objects
    """
    workflow = resolve_issue_workflow(issue)
    if not workflow:
        return []

    # Get transitions from current state + global transitions
    transitions = WorkflowTransition.objects.filter(
        workflow=workflow,
    ).filter(
        models.Q(from_state=issue.state) | models.Q(from_state__isnull=True, is_global=True)
    ).prefetch_related("conditions", "screen")
    
    # Filter by conditions the user satisfies
    available_transitions = []
    for transition in transitions:
        allowed, _ = check_conditions(user, issue, transition)
        if allowed:
            available_transitions.append(transition)
    
    return available_transitions
