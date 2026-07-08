"""Tests for classic project Intake (promote to backlog on accept)."""

from unittest.mock import Mock, patch

import pytest

from operoz.utils.intake_workflow import promote_issue_to_backlog, resolve_backlog_state


@pytest.mark.unit
class TestIntakeWorkflow:
    @patch("operoz.utils.intake_workflow.State")
    def test_resolve_backlog_state_excludes_triage(self, mock_state):
        project = Mock(id="p1", workspace_id="w1")
        _triage = Mock(id="triage-id", group="triage")
        backlog = Mock(id="backlog-id", group="backlog")

        qs = mock_state.objects.filter.return_value
        qs.exclude.return_value.order_by.return_value.first.side_effect = [backlog, backlog]

        resolved = resolve_backlog_state(project)
        assert resolved is backlog
        qs.exclude.assert_called()

    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_promote_issue_to_backlog(self, mock_resolve):
        project = Mock(id="p1", workspace_id="w1")
        backlog = Mock(id="backlog-id")
        issue = Mock(state_id="triage-id")
        mock_resolve.return_value = backlog

        promote_issue_to_backlog(issue, project)

        assert issue.state_id == "backlog-id"
        issue.save.assert_called_once()

    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_promote_issue_skips_when_already_in_backlog(self, mock_resolve):
        project = Mock(id="p1", workspace_id="w1")
        backlog = Mock(id="backlog-id")
        issue = Mock(state_id="backlog-id")
        mock_resolve.return_value = backlog

        promote_issue_to_backlog(issue, project)

        issue.save.assert_not_called()
