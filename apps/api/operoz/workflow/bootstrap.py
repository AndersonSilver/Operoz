"""
Bootstrap helpers for workflow rollout.
"""

from typing import Literal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from operoz.db.models import Project, State, Workflow, WorkflowTransition, Workspace
from operoz.workflow.graph import models_to_graph

User = get_user_model()

WorkflowBootstrapMode = Literal["linear", "open"]
WorkflowBackTransitionMode = Literal["none", "adjacent", "last_only"]
WORKFLOW_BOOTSTRAP_LINEAR: WorkflowBootstrapMode = "linear"
WORKFLOW_BOOTSTRAP_OPEN: WorkflowBootstrapMode = "open"


def _project_states(project: Project) -> list[State]:
    states = list(
        State.objects.filter(project=project, deleted_at__isnull=True).order_by("sequence")
    )
    if not states:
        raise ValueError("Project has no states")
    return states


def _transition_pairs(
    states: list[State],
    mode: WorkflowBootstrapMode,
    back_transition_mode: WorkflowBackTransitionMode = "none",
) -> list[tuple[State, State]]:
    if mode == WORKFLOW_BOOTSTRAP_OPEN:
        return [
            (from_state, to_state)
            for from_state in states
            for to_state in states
            if from_state.id != to_state.id
        ]

    if len(states) < 2:
        return []

    forward = [(states[index], states[index + 1]) for index in range(len(states) - 1)]
    if back_transition_mode == "none":
        return forward

    if back_transition_mode == "adjacent":
        backward = [(states[index + 1], states[index]) for index in range(len(states) - 1)]
        return forward + backward

    if back_transition_mode == "last_only":
        return forward + [(states[-1], states[-2])]

    return forward


def _resolve_back_transition_mode(
    back_transition_mode: WorkflowBackTransitionMode | None,
    allow_back_transitions: bool,
) -> WorkflowBackTransitionMode:
    if back_transition_mode is not None:
        return back_transition_mode
    return "adjacent" if allow_back_transitions else "none"


def create_workflow_from_project(
    project: Project,
    workspace: Workspace,
    user: User,
    mode: WorkflowBootstrapMode = WORKFLOW_BOOTSTRAP_LINEAR,
    allow_back_transitions: bool = False,
    back_transition_mode: WorkflowBackTransitionMode | None = None,
    name: str | None = None,
) -> Workflow:
    """
    Create a published workflow from a project's states.

    - linear (default): adjacent forward transitions (Backlog → Todo → …)
    - linear + back_transition_mode=adjacent: forward and reverse between adjacent states
    - linear + back_transition_mode=last_only: forward + single back from last state only
    - open: all-to-all transitions (legacy free state-change behavior)
    """
    states = _project_states(project)
    initial = next((state for state in states if state.default), states[0])
    resolved_back_mode = _resolve_back_transition_mode(back_transition_mode, allow_back_transitions)

    if mode == WORKFLOW_BOOTSTRAP_OPEN:
        default_name = f"{project.name} — Open"
        description = "Auto-generated open workflow (all state transitions allowed)."
    elif resolved_back_mode == "adjacent":
        default_name = f"{project.name} — Linear (retorno)"
        description = (
            "Auto-generated linear workflow with adjacent back transitions "
            "(e.g. In Progress → Todo)."
        )
    elif resolved_back_mode == "last_only":
        default_name = f"{project.name} — Linear (retorno final)"
        description = (
            "Auto-generated linear workflow with a single back transition from the "
            "last state to the previous one."
        )
    else:
        default_name = f"{project.name} — Linear"
        description = "Auto-generated linear workflow (forward transitions between adjacent states)."

    pairs = _transition_pairs(states, mode, back_transition_mode=resolved_back_mode)

    with transaction.atomic():
        workflow = Workflow.objects.create(
            workspace=workspace,
            name=name or default_name,
            description=description,
            is_draft=False,
            is_active=True,
            initial_state=initial,
            published_version=1,
            published_at=timezone.now(),
            created_by=user,
            updated_by=user,
        )

        sort_order = 10000.0
        for from_state, to_state in pairs:
            WorkflowTransition.objects.create(
                workflow=workflow,
                from_state=from_state,
                to_state=to_state,
                name=f"→ {to_state.name}",
                is_global=False,
                sort_order=sort_order,
                created_by=user,
                updated_by=user,
            )
            sort_order += 1000.0

        workflow.published_graph = models_to_graph(workflow)
        workflow.save(update_fields=["published_graph", "updated_at"])

    return workflow


def create_linear_workflow_from_project(
    project: Project,
    workspace: Workspace,
    user: User,
    name: str | None = None,
) -> Workflow:
    return create_workflow_from_project(
        project,
        workspace,
        user,
        mode=WORKFLOW_BOOTSTRAP_LINEAR,
        name=name,
    )


def create_open_workflow_from_project(
    project: Project,
    workspace: Workspace,
    user: User,
    name: str | None = None,
) -> Workflow:
    return create_workflow_from_project(
        project,
        workspace,
        user,
        mode=WORKFLOW_BOOTSTRAP_OPEN,
        name=name,
    )
