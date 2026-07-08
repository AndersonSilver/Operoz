from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from operoz.workflow.conditions import check_conditions
from operoz.workflow.engine import (
    execute_transition,
    get_available_transitions,
)
from operoz.workflow.validators import run_validators


def _transition(*, conditions=None, validators=None, to_state=None):
    transition = Mock()
    transition.id = "transition-1"
    transition.name = "Start Progress"
    transition.to_state = to_state or SimpleNamespace(id="state-2", name="In Progress")
    transition.conditions.all.return_value = conditions or []
    transition.validators.all.return_value = validators or []
    transition.post_functions.all.return_value = []
    return transition


@pytest.mark.unit
def test_check_conditions_assignee_only_blocks_non_assignee():
    user = SimpleNamespace(id="user-1")
    _assignee = SimpleNamespace(id="user-2")
    issue = Mock()
    issue.assignees.filter.return_value.exists.return_value = False
    issue.assignees.exists.return_value = True

    condition = SimpleNamespace(condition_type="assignee_only", config={})
    transition = _transition(conditions=[condition])

    allowed, _ = check_conditions(user, issue, transition)
    assert allowed is False


@pytest.mark.unit
def test_validator_required_fields_returns_error():
    validator = SimpleNamespace(validator_type="required_fields", config={"fields": ["resolution"]})
    transition = _transition(validators=[validator])
    issue = Mock()

    errors = run_validators(issue, {}, transition)
    assert any("resolution" in err for err in errors)


@pytest.mark.unit
@patch("operoz.workflow.engine.run_post_functions")
@patch("operoz.workflow.engine.IssueActivity.objects.create")
@patch("operoz.workflow.engine.transaction.atomic")
def test_execute_transition_happy_path(mock_atomic, mock_activity_create, mock_post_functions):
    mock_atomic.return_value.__enter__ = Mock(return_value=None)
    mock_atomic.return_value.__exit__ = Mock(return_value=False)

    actor = SimpleNamespace(id="user-1")
    from_state = SimpleNamespace(id="state-1", name="Backlog")
    to_state = SimpleNamespace(id="state-2", name="In Progress")

    issue = Mock()
    issue.id = "issue-1"
    issue.project_id = "proj-1"
    issue.workspace_id = "ws-1"
    issue.state_id = "state-1"
    issue.state = from_state
    issue.save = Mock()

    transition = _transition(to_state=to_state)

    with patch("operoz.workflow.engine.check_conditions", return_value=(True, "")):
        with patch("operoz.workflow.engine.run_validators", return_value=[]):
            issue.refresh_from_db = Mock()
            result = execute_transition(issue, transition, actor, {"comment": "ok"})

    assert result.state == to_state
    issue.save.assert_called_once_with(update_fields=["state"])
    mock_activity_create.assert_called_once()
    call_kwargs = mock_activity_create.call_args.kwargs
    assert call_kwargs["field"] == "state"
    assert call_kwargs["verb"] == "updated"
    assert "transition" not in call_kwargs
    assert "extra_data" not in call_kwargs


@pytest.mark.unit
@patch("operoz.workflow.engine.resolve_issue_workflow")
@patch("operoz.workflow.engine.WorkflowTransition.objects")
def test_get_available_transitions_does_not_filter_is_active(mock_transition_manager, mock_resolve):
    user = SimpleNamespace(id="user-1")
    issue = Mock()
    issue.state = SimpleNamespace(id="state-1")
    workflow = SimpleNamespace(id="wf-1")
    mock_resolve.return_value = workflow

    qs = Mock()
    qs.filter.return_value = qs
    qs.prefetch_related.return_value = []
    mock_transition_manager.filter.return_value = qs

    result = get_available_transitions(issue, user)
    assert result == []
    mock_transition_manager.filter.assert_called_with(workflow=workflow)
