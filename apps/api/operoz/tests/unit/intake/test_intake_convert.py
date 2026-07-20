"""Unit tests for cross-project intake conversion (E1) and typed outcomes (E2/E5)."""

from unittest.mock import MagicMock, Mock, patch, call

import pytest

from operoz.utils.intake_workflow import (
    IntakeConvertError,
    convert_intake_to_project,
    promote_issue_to_backlog,
)


# ---------------------------------------------------------------------------
# E1 — convert_intake_to_project
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestConvertIntakeToProject:
    @patch("operoz.utils.intake_workflow.IssueRelation")
    @patch("operoz.utils.intake_workflow.Issue")
    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_creates_issue_in_destination_project(self, mock_resolve, mock_issue_cls, mock_relation_cls):
        backlog_state = Mock(id="bs-id")
        mock_resolve.return_value = backlog_state

        dest_project = Mock(id="dest-proj", workspace_id="ws-1")
        # Mock.name is special (sets internal mock name, not .name attribute)
        source_issue = Mock(id="src-issue", description_html="<p>desc</p>", priority="high",
                            project_id="src-proj", workspace_id="ws-1")
        source_issue.name = "Feature X"
        intake_issue = Mock(issue=source_issue)

        created_issue = Mock(id="dest-issue")
        mock_issue_cls.objects.create.return_value = created_issue
        mock_relation_cls.objects.get_or_create.return_value = (Mock(), True)

        result = convert_intake_to_project(intake_issue, dest_project, actor_id="actor-1")

        mock_issue_cls.objects.create.assert_called_once_with(
            name="Feature X",
            description_html="<p>desc</p>",
            priority="high",
            state_id="bs-id",
            project_id="dest-proj",
            workspace_id="ws-1",
            created_by_id="actor-1",
            updated_by_id="actor-1",
        )
        assert result is created_issue
        assert intake_issue.converted_to_issue is created_issue

    @patch("operoz.utils.intake_workflow.IssueRelation")
    @patch("operoz.utils.intake_workflow.Issue")
    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_creates_relates_to_relation(self, mock_resolve, mock_issue_cls, mock_relation_cls):
        backlog_state = Mock(id="bs-id")
        mock_resolve.return_value = backlog_state

        source_issue = Mock(id="src-issue", description_html="<p></p>", priority="none",
                            project_id="src-proj", workspace_id="ws-1")
        source_issue.name = "X"
        dest_project = Mock(id="dest-proj", workspace_id="ws-1")
        intake_issue = Mock(issue=source_issue)

        dest_issue = Mock(id="dest-issue")
        mock_issue_cls.objects.create.return_value = dest_issue
        mock_relation_cls.objects.get_or_create.return_value = (Mock(), True)

        from operoz.db.models.issue import IssueRelationChoices

        convert_intake_to_project(intake_issue, dest_project, actor_id="actor-1")

        mock_relation_cls.objects.get_or_create.assert_called_once()
        kwargs = mock_relation_cls.objects.get_or_create.call_args[1]
        assert kwargs["defaults"]["relation_type"] == IssueRelationChoices.RELATES_TO
        assert kwargs["issue"] is source_issue
        assert kwargs["related_issue"] is dest_issue

    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_raises_when_no_backlog_state(self, mock_resolve):
        mock_resolve.return_value = None
        dest_project = Mock(id="dest-proj", workspace_id="ws-1")
        intake_issue = Mock(issue=Mock())

        with pytest.raises(IntakeConvertError, match="backlog"):
            convert_intake_to_project(intake_issue, dest_project, actor_id=None)

    @patch("operoz.utils.intake_workflow.IssueRelation")
    @patch("operoz.utils.intake_workflow.Issue")
    @patch("operoz.utils.intake_workflow.resolve_backlog_state")
    def test_uses_none_as_description_when_source_empty(self, mock_resolve, mock_issue_cls, mock_relation_cls):
        backlog_state = Mock(id="bs-id")
        mock_resolve.return_value = backlog_state

        source_issue = Mock(id="src", description_html=None, priority="none",
                            project_id="p1", workspace_id="w1")
        source_issue.name = "T"
        dest_project = Mock(id="p2", workspace_id="w1")
        intake_issue = Mock(issue=source_issue)

        dest_issue = Mock(id="di")
        mock_issue_cls.objects.create.return_value = dest_issue
        mock_relation_cls.objects.get_or_create.return_value = (Mock(), True)

        convert_intake_to_project(intake_issue, dest_project, actor_id=None)

        create_call = mock_issue_cls.objects.create.call_args[1]
        assert create_call["description_html"] == "<p></p>"


# ---------------------------------------------------------------------------
# E2 — IntakeOutcome enum values
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestIntakeOutcome:
    def test_outcome_choices_exist(self):
        from operoz.db.models.intake import IntakeOutcome

        assert IntakeOutcome.CONVERTED == "converted"
        assert IntakeOutcome.CONSULTING == "consulting"
        assert IntakeOutcome.DEFERRED == "deferred"
        assert IntakeOutcome.REJECTED == "rejected"

    def test_discord_source_type_exists(self):
        from operoz.db.models.intake import SourceType

        assert SourceType.DISCORD == "DISCORD"


# ---------------------------------------------------------------------------
# E3 — automation hooks: new emit functions exist and call emit_issue_event
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestIntakeAutomationHooks:
    @patch("operoz.automation.hooks.emit_issue_event")
    def test_emit_intake_converted(self, mock_emit):
        from operoz.automation.hooks import emit_intake_converted

        issue = Mock()
        emit_intake_converted(issue, actor_id="a1", destination_project_id="dp1", destination_issue_id="di1")

        mock_emit.assert_called_once_with(
            event_type="intake.converted",
            issue=issue,
            actor_id="a1",
            extra={"destination_project_id": "dp1", "destination_issue_id": "di1"},
        )

    @patch("operoz.automation.hooks.emit_issue_event")
    def test_emit_intake_rejected(self, mock_emit):
        from operoz.automation.hooks import emit_intake_rejected

        issue = Mock()
        emit_intake_rejected(issue, actor_id="a1", decline_category="spam", decline_reason="not relevant")

        mock_emit.assert_called_once_with(
            event_type="intake.rejected",
            issue=issue,
            actor_id="a1",
            extra={"decline_category": "spam", "decline_reason": "not relevant"},
        )

    @patch("operoz.automation.hooks.emit_issue_event")
    def test_emit_intake_deferred(self, mock_emit):
        from operoz.automation.hooks import emit_intake_deferred

        issue = Mock()
        emit_intake_deferred(issue, actor_id="a2", deferred_until="2026-12-01")

        mock_emit.assert_called_once_with(
            event_type="intake.deferred",
            issue=issue,
            actor_id="a2",
            extra={"deferred_until": "2026-12-01"},
        )

    @patch("operoz.automation.hooks.emit_issue_event")
    def test_emit_intake_consulting(self, mock_emit):
        from operoz.automation.hooks import emit_intake_consulting

        issue = Mock()
        emit_intake_consulting(issue, actor_id="a3", outcome_note="Orientado via call")

        mock_emit.assert_called_once_with(
            event_type="intake.consulting",
            issue=issue,
            actor_id="a3",
            extra={"outcome_note": "Orientado via call"},
        )

    @patch("operoz.automation.hooks.emit_issue_event")
    def test_emit_intake_needs_info(self, mock_emit):
        from operoz.automation.hooks import emit_intake_needs_info

        issue = Mock()
        emit_intake_needs_info(issue, actor_id="a4")

        mock_emit.assert_called_once_with(
            event_type="intake.needs_info",
            issue=issue,
            actor_id="a4",
        )


# ---------------------------------------------------------------------------
# E3 — catalog: new triggers are registered
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestIntakeTriggerCatalog:
    def test_new_intake_triggers_registered(self):
        from operoz.automation.catalog.triggers import register_triggers
        from operoz.automation.catalog.registry import catalog

        register_triggers()

        registered_keys = {entry.key for entry in catalog._entries.values()}
        assert "intake.converted" in registered_keys
        assert "intake.rejected" in registered_keys
        assert "intake.deferred" in registered_keys
        assert "intake.consulting" in registered_keys
        assert "intake.needs_info" in registered_keys
