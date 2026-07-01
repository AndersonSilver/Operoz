from types import SimpleNamespace
from unittest.mock import patch

import pytest

from operoz.workflow.bootstrap import (
    WORKFLOW_BOOTSTRAP_LINEAR,
    WORKFLOW_BOOTSTRAP_OPEN,
    _transition_pairs,
    create_workflow_from_project,
)


def _state(state_id: str, sequence: float, name: str, default: bool = False):
    return SimpleNamespace(id=state_id, sequence=sequence, name=name, default=default)


@pytest.mark.unit
def test_transition_pairs_linear_connects_adjacent_states_only():
    states = [
        _state("1", 1, "Backlog", default=True),
        _state("2", 2, "Todo"),
        _state("3", 3, "In Progress"),
        _state("4", 4, "Done"),
    ]
    pairs = _transition_pairs(states, WORKFLOW_BOOTSTRAP_LINEAR)
    assert len(pairs) == 3
    assert pairs[0][0].name == "Backlog" and pairs[0][1].name == "Todo"
    assert pairs[-1][1].name == "Done"


@pytest.mark.unit
def test_transition_pairs_linear_with_back_adds_adjacent_reverse_only():
    states = [
        _state("1", 1, "Backlog", default=True),
        _state("2", 2, "Todo"),
        _state("3", 3, "In Progress"),
        _state("4", 4, "Done"),
    ]
    pairs = _transition_pairs(states, WORKFLOW_BOOTSTRAP_LINEAR, back_transition_mode="adjacent")
    assert len(pairs) == 6
    assert (states[0], states[1]) in pairs
    assert (states[1], states[0]) in pairs
    assert (states[3], states[0]) not in pairs


@pytest.mark.unit
def test_transition_pairs_linear_with_last_only_adds_single_reverse_from_terminal():
    states = [
        _state("1", 1, "Backlog", default=True),
        _state("2", 2, "Todo"),
        _state("3", 3, "In Progress"),
        _state("4", 4, "Done"),
    ]
    pairs = _transition_pairs(states, WORKFLOW_BOOTSTRAP_LINEAR, back_transition_mode="last_only")
    assert len(pairs) == 4
    assert (states[3], states[2]) in pairs
    assert (states[2], states[1]) not in pairs
    assert (states[1], states[0]) not in pairs


@pytest.mark.unit
def test_transition_pairs_open_is_all_to_all():
    states = [
        _state("1", 1, "Backlog"),
        _state("2", 2, "Todo"),
        _state("3", 3, "Done"),
    ]
    pairs = _transition_pairs(states, WORKFLOW_BOOTSTRAP_OPEN)
    assert len(pairs) == 6


@pytest.mark.unit
@patch("operoz.workflow.bootstrap.transaction.atomic")
@patch("operoz.workflow.bootstrap.models_to_graph")
@patch("operoz.workflow.bootstrap.WorkflowTransition.objects")
@patch("operoz.workflow.bootstrap.Workflow.objects")
@patch("operoz.workflow.bootstrap._project_states")
def test_create_workflow_from_project_linear_name(
    mock_project_states,
    mock_workflow_manager,
    mock_transition_manager,
    mock_models_to_graph,
    mock_atomic,
):
    mock_atomic.return_value.__enter__ = lambda self: None
    mock_atomic.return_value.__exit__ = lambda self, *args: None

    project = SimpleNamespace(id="proj-1", name="TRADICAO")
    workspace = SimpleNamespace(id="ws-1")
    user = SimpleNamespace(id="user-1")

    states = [
        _state("1", 1, "Backlog", default=True),
        _state("2", 2, "Todo"),
    ]
    mock_project_states.return_value = states

    workflow = SimpleNamespace(
        id="wf-1",
        transitions=SimpleNamespace(all=lambda: []),
        save=lambda **kwargs: None,
    )
    mock_workflow_manager.create.return_value = workflow
    mock_models_to_graph.return_value = {"nodes": [], "edges": []}

    result = create_workflow_from_project(
        project,
        workspace,
        user,
        mode=WORKFLOW_BOOTSTRAP_LINEAR,
    )

    assert result is workflow
    create_kwargs = mock_workflow_manager.create.call_args.kwargs
    assert create_kwargs["name"] == "TRADICAO — Linear"
    assert mock_transition_manager.create.call_count == 1
