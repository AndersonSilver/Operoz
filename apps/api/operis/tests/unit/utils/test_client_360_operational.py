from __future__ import annotations

import pytest

from operis.utils.client_360_operational import (
    DEFAULT_SUPPORT_SLA_DAYS,
    resolve_support_sla_days,
    serialize_intake_type,
)


@pytest.mark.unit
class TestResolveSupportSlaDays:
    def test_default_when_board_missing(self):
        assert resolve_support_sla_days("missing-board", {}) == DEFAULT_SUPPORT_SLA_DAYS

    def test_uses_board_map(self):
        board_id = "board-1"
        assert resolve_support_sla_days(board_id, {board_id: 3}) == 3


@pytest.mark.unit
@pytest.mark.django_db
class TestSerializeIntakeType:
    def test_serializes_row(self, workspace, workspace_board):
        from operis.db.models import BoardClient360IntakeType

        row = BoardClient360IntakeType.objects.create(
            workspace=workspace,
            board=workspace_board,
            name="Entrada",
            slug="entrada",
            type_name_pattern="intake",
            sort_order=1,
        )
        payload = serialize_intake_type(row)
        assert payload["name"] == "Entrada"
        assert payload["type_name_pattern"] == "intake"
        assert payload["board_id"] == str(workspace_board.id)
