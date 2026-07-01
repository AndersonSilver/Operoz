from __future__ import annotations

import pytest

from operoz.utils.client_360_narrative import serialize_narrative, upsert_narrative
from operoz.utils.client_360_matrix_csv_export import build_client360_matrix_csv_content


@pytest.mark.unit
class TestSerializeNarrative:
    def test_empty_when_none(self):
        payload = serialize_narrative(None)
        assert payload["wins_md"] == ""
        assert payload["updated_at"] is None


@pytest.mark.unit
@pytest.mark.django_db
class TestUpsertNarrative:
    def test_creates_and_updates(self, workspace, workspace_board, create_user):
        from operoz.db.models import Project
        from datetime import date

        project = Project.objects.create(
            name="Narrativa",
            identifier="NAR",
            workspace=workspace,
            board=workspace_board,
            created_by=create_user,
        )
        period_start = date(2026, 6, 9)
        period_end = date(2026, 6, 15)
        row = upsert_narrative(
            workspace_id=workspace.id,
            project_id=project.id,
            period_start=period_start,
            period_end=period_end,
            wins_md="Win A",
        )
        assert row.wins_md == "Win A"
        row2 = upsert_narrative(
            workspace_id=workspace.id,
            project_id=project.id,
            period_start=period_start,
            period_end=period_end,
            wins_md="Win B",
            risks_md="Risk 1",
        )
        assert row2.id == row.id
        assert row2.risks_md == "Risk 1"


@pytest.mark.unit
class TestMatrixCsvExport:
    def test_rectangular_csv(self):
        weeks = [
            {"period_start": "2026-06-02", "period_end": "2026-06-08"},
            {"period_start": "2026-06-09", "period_end": "2026-06-15"},
        ]
        clients = [
            {
                "name": "Alpha",
                "identifier": "ALP",
                "board": {"name": "Board A"},
                "cells": [
                    {
                        "period_start": "2026-06-02",
                        "coverage": "missing",
                        "modules_total": 1,
                        "modules_published": 0,
                    },
                    {
                        "period_start": "2026-06-09",
                        "coverage": "complete",
                        "modules_total": 1,
                        "modules_published": 1,
                    },
                ],
            }
        ]
        content = build_client360_matrix_csv_content(clients=clients, weeks=weeks, delimiter=";")
        lines = content.strip().split("\n")
        assert len(lines) == 3
        assert "Alpha" in lines[1]
        assert "missing" in lines[1]
