from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from django.utils import timezone

from operis.utils.board_support_sla import compute_support_sla_breach
from operis.utils.intake_submission import IntakeSubmissionError, _validate_submission_fields_from_list
from operis.utils.support_ticket import (
    apply_support_field_updates,
    compute_support_metrics,
    enrich_intake_extra,
    serialize_support_ticket_metadata,
)


@pytest.mark.unit
def test_submit_validates_criticality_field():
    fields = [
        {"id": "field-name", "field_type": "name", "label": "Resumo", "required": True},
        {"id": "field-criticality", "field_type": "criticality", "label": "Criticidade", "required": True},
    ]

    with pytest.raises(IntakeSubmissionError) as exc:
        _validate_submission_fields_from_list(
            fields,
            {"field-name": "Erro intermitente", "field-criticality": "p9"},
        )

    assert exc.value.field_errors["field-criticality"] == "Criticidade inválido."


@pytest.mark.unit
@patch("operis.utils.support_ticket.get_criticality_duration_minutes", return_value=480)
def test_create_computes_sla_due_at_from_criticality(_mock_duration):
    opened_at = timezone.now()
    board_form = SimpleNamespace(id="form-1", name="Suporte", theme="support")

    extra = enrich_intake_extra(
        intake_form=None,
        board_intake_form=board_form,
        submission={"field-name": "API fora do ar"},
        fields=[],
        support_extra={"criticality": "p1"},
        board_id="board-1",
        opened_at=opened_at,
    )

    support = extra["support"]
    expected_due = (opened_at + timedelta(minutes=480)).isoformat()
    assert support["sla_due_at"] == expected_due
    assert support["sla_due_at_original"] == expected_due
    assert support["sla_due_at_overridden"] is False


@pytest.mark.unit
def test_manual_sla_override_is_preserved_on_criticality_change():
    opened_at = timezone.now() - timedelta(hours=2)
    manual_due = (timezone.now() + timedelta(hours=3)).isoformat()
    instance = Mock()
    instance.created_at = opened_at
    instance.project = Mock(board_id="board-1")
    instance.extra = {
        "support": {
            "criticality": "p2",
            "sla_due_at": manual_due,
            "sla_due_at_original": manual_due,
            "sla_due_at_overridden": True,
        }
    }

    apply_support_field_updates(instance, criticality="p0", actor_id="user-1")

    support = instance.extra["support"]
    assert support["criticality"] == "p0"
    assert support["sla_due_at"] == manual_due
    assert support["sla_due_at_overridden"] is True


@pytest.mark.unit
def test_metrics_include_tta_and_ttr():
    opened_at = timezone.now() - timedelta(hours=5)
    accepted_at = opened_at + timedelta(minutes=30)
    closed_at = opened_at + timedelta(hours=3)

    metrics = compute_support_metrics(
        {"accepted_at": accepted_at.isoformat(), "closed_at": closed_at.isoformat()},
        opened_at,
    )

    assert metrics["time_to_accept_seconds"] == 1800
    assert metrics["time_to_resolve_seconds"] == 10800
    assert metrics["time_in_progress_seconds"] == 9000


@pytest.mark.unit
@patch("operis.utils.support_ticket.get_board_support_sla_days", return_value=7)
def test_sla_breach_uses_criticality_due_date(_mock_sla_days):
    now = timezone.now()
    intake_issue = Mock()
    intake_issue.status = 1
    intake_issue.created_at = now - timedelta(days=1)
    intake_issue.source_email = None
    intake_issue.intake_form_id = None
    intake_issue.intake_form = None
    intake_issue.board_intake_form_id = "board-form-1"
    intake_issue.board_intake_form = SimpleNamespace(name="Form", fields=[], theme="support")
    intake_issue.support_queue_id = None
    intake_issue.project = Mock(name="Cliente A", identifier="CLI-A", board_id="board-1")
    intake_issue.extra = {
        "support": {
            "criticality": "p0",
            "sla_due_at": (now - timedelta(minutes=5)).isoformat(),
        }
    }

    payload = serialize_support_ticket_metadata(intake_issue, intake_issue.project)

    assert payload["criticality"] == "p0"
    assert payload["sla_breached"] is True
    assert compute_support_sla_breach(
        sla_due_at=timezone.now() - timedelta(minutes=1),
        status=1,
        closed_at=None,
    )
