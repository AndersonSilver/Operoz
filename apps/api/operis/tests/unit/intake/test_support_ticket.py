from datetime import timedelta
from unittest.mock import Mock, patch

import pytest
from django.utils import timezone

from operis.utils.support_ticket import (
    DECLINE_CATEGORIES,
    SupportTicketValidationError,
    apply_triage_extra_updates,
    build_submission_display,
    compute_sla,
    enrich_intake_extra,
    format_queue_age,
    validate_accept,
    validate_close,
    validate_decline,
    validate_delete_reason,
)


@pytest.mark.unit
class TestFormatQueueAge:
    def test_minutes_for_recent_ticket(self):
        created = timezone.now() - timedelta(minutes=12)
        assert format_queue_age(created) == "12m"

    def test_hours_for_same_day(self):
        created = timezone.now() - timedelta(hours=5)
        assert format_queue_age(created) == "5h"

    def test_days_for_old_ticket(self):
        created = timezone.now() - timedelta(days=3)
        assert format_queue_age(created) == "3d"


@pytest.mark.unit
class TestComputeSla:
    def test_not_breached_within_window(self):
        created = timezone.now() - timedelta(days=2)
        result = compute_sla(created_at=created, sla_days=7)
        assert result["sla_breached"] is False
        assert result["sla_days"] == 7

    def test_breached_after_window(self):
        created = timezone.now() - timedelta(days=10)
        result = compute_sla(created_at=created, sla_days=7)
        assert result["sla_breached"] is True


@pytest.mark.unit
class TestBuildSubmissionDisplay:
    def test_skips_empty_and_client_field(self):
        fields = [
            {"id": "client", "field_type": "client", "label": "Cliente"},
            {"id": "summary", "field_type": "name", "label": "Resumo"},
            {"id": "desc", "field_type": "description", "label": "Descrição"},
            {"id": "files", "field_type": "attachment", "label": "Anexos"},
        ]
        submission = {"client": "uuid", "summary": "Bug login", "desc": "", "files": ["asset-1"]}
        rows = build_submission_display(fields, submission)
        assert rows == [{"label": "Resumo", "value": "Bug login"}]

    def test_strips_html_from_description(self):
        fields = [
            {"id": "desc", "field_type": "description", "label": "Descrição"},
        ]
        submission = {
            "desc": '<p class="editor-paragraph-block">Não consigo fazer login</p>',
        }
        rows = build_submission_display(fields, submission)
        assert rows == [{"label": "Descrição", "value": "Não consigo fazer login"}]


@pytest.mark.unit
class TestEnrichIntakeExtra:
    def test_board_form_metadata(self):
        board_form = Mock()
        board_form.id = "form-1"
        board_form.name = "Chamado Sustentação"
        board_form.theme = "support"
        board_form.fields = [{"id": "summary", "field_type": "name", "label": "Resumo"}]

        extra = enrich_intake_extra(
            intake_form=None,
            board_intake_form=board_form,
            submission={"summary": "Erro 500"},
            fields=board_form.fields,
        )
        assert extra["form_name"] == "Chamado Sustentação"
        assert extra["form_theme"] == "support"
        assert extra["submission_fields"][0]["value"] == "Erro 500"


@pytest.mark.unit
class TestValidateDecline:
    def test_requires_category_and_reason(self):
        with pytest.raises(SupportTicketValidationError):
            validate_decline(status=-1, decline_reason="", decline_category="spam")

    def test_accepts_valid_decline(self):
        validate_decline(status=-1, decline_reason="Fora do escopo contratual", decline_category="out_of_scope")
        assert "out_of_scope" in DECLINE_CATEGORIES


@pytest.mark.unit
class TestValidateDeleteReason:
    def test_rejects_short_reason(self):
        with pytest.raises(SupportTicketValidationError):
            validate_delete_reason("abc")

    def test_accepts_valid_reason(self):
        assert validate_delete_reason("  Spam duplicado enviado por bot  ") == "Spam duplicado enviado por bot"


@pytest.mark.unit
class TestApplyTriageExtraUpdates:
    def test_decline_persists_metadata(self):
        instance = Mock()
        instance.extra = {}
        apply_triage_extra_updates(
            instance,
            status=-1,
            decline_reason="Informação insuficiente",
            decline_category="insufficient_info",
            actor_id="user-1",
        )
        assert instance.extra["decline_category"] == "insufficient_info"
        assert instance.extra["declined_by"] == "user-1"

    def test_reopen_clears_decline(self):
        instance = Mock()
        instance.extra = {
            "decline_reason": "x",
            "decline_category": "spam",
            "declined_at": "2026-01-01",
        }
        apply_triage_extra_updates(instance, status=-2, reopen=True, actor_id="user-2")
        assert "decline_reason" not in instance.extra
        assert instance.extra["reopened_by"] == "user-2"

    def test_close_persists_resolution(self):
        instance = Mock()
        instance.extra = {"accepted_at": "2026-01-01"}
        apply_triage_extra_updates(instance, status=3, actor_id="user-1", resolution_note="Resolvido no cliente")
        assert instance.extra["closed_at"]
        assert instance.extra["closed_by"] == "user-1"
        assert instance.extra["resolution_note"] == "Resolvido no cliente"


@pytest.mark.unit
class TestSupportQueueValidation:
    def test_accept_requires_queue_id(self):
        project = Mock(board_id="board-1")
        with pytest.raises(SupportTicketValidationError):
            validate_accept(status=1, queue_id=None, project=project)

    @patch("operis.utils.support_ticket.resolve_project_support_queue")
    def test_accept_resolves_valid_queue(self, mock_resolve):
        project = Mock(board_id="board-1")
        mock_resolve.return_value = Mock()
        validate_accept(status=1, queue_id="queue-uuid", project=project)
        mock_resolve.assert_called_once()

    def test_close_only_from_in_progress(self):
        with pytest.raises(SupportTicketValidationError):
            validate_close(status=3, current_status=-2)

    def test_close_from_accepted(self):
        validate_close(status=3, current_status=1)


@pytest.mark.unit
class TestAcceptWithoutBoardPromotion:
    def test_validate_allows_accept_without_default_state(self):
        from operis.app.serializers.intake import IntakeIssueSerializer

        instance = Mock()
        instance.issue = Mock(state=Mock(group="triage"))
        instance.project = Mock(board_id="board-1")
        instance.status = -2
        serializer = IntakeIssueSerializer(instance=instance)

        with patch("operis.utils.support_ticket.resolve_project_support_queue") as mock_resolve:
            mock_resolve.return_value = Mock()
            result = serializer.validate({"status": 1, "queue_id": "queue-1"})
            assert result["status"] == 1

    def test_update_does_not_change_issue_state(self):
        from operis.app.serializers.intake import IntakeIssueSerializer

        issue = Mock(state=Mock(group="triage"))
        issue.save = Mock()
        instance = Mock()
        instance.issue = issue
        instance.status = -2
        instance.extra = {}
        instance.project = Mock(board_id="board-1")

        serializer = IntakeIssueSerializer(instance=instance, context={"request": Mock(user=Mock(id="user-1"))})

        with patch("operis.app.serializers.intake.resolve_project_support_queue") as mock_resolve:
            mock_resolve.return_value = Mock()
            with patch.object(IntakeIssueSerializer.__mro__[1], "update", return_value=instance):
                serializer.update(instance, {"status": 1, "queue_id": "queue-1"})

        issue.save.assert_not_called()


@pytest.mark.unit
class TestGetBoardSupportSlaDays:
    @patch("operis.db.models.BoardClient360HealthSettings.objects")
    def test_defaults_when_missing(self, mock_qs):
        from operis.utils.support_ticket import get_board_support_sla_days

        mock_qs.filter.return_value.only.return_value.first.return_value = None
        assert get_board_support_sla_days("board-id") == 7

    @patch("operis.db.models.BoardClient360HealthSettings.objects")
    def test_reads_board_setting(self, mock_qs):
        from operis.utils.support_ticket import get_board_support_sla_days

        mock_qs.filter.return_value.only.return_value.first.return_value = Mock(support_sla_days=3)
        assert get_board_support_sla_days("board-id") == 3
