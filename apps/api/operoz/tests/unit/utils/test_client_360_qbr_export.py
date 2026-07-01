from __future__ import annotations

from datetime import date

import pytest

from operoz.utils.client_360 import WeekPeriod
from operoz.utils.client_360_qbr_export import (
    QBR_DEFAULT_WEEKS,
    QbrBuildInput,
    build_qbr_matrix_summary,
    build_qbr_payload,
    build_qbr_wins_risks,
    parse_qbr_format,
    parse_qbr_weeks,
    qbr_to_markdown,
)


class TestParseQbrWeeks:
    def test_default_thirteen(self):
        weeks, err = parse_qbr_weeks(None)
        assert err is None
        assert weeks == QBR_DEFAULT_WEEKS

    def test_rejects_over_max(self):
        _, err = parse_qbr_weeks("14")
        assert err is not None


class TestParseQbrFormat:
    def test_accepts_md_and_pdf(self):
        assert parse_qbr_format("md")[1] is None
        assert parse_qbr_format("pdf")[1] is None

    def test_rejects_unknown(self):
        _, err = parse_qbr_format("docx")
        assert err is not None


class TestBuildQbrWinsRisks:
    def test_detects_win_and_risk(self):
        clients = [
            {
                "name": "Alpha",
                "health": "ok",
                "health_score": 80,
                "status_report": {"coverage": "complete"},
                "issues": {"overdue": 0},
                "support": {"overdue_count": 0},
                "period_compare": {"available": True, "overdue_delta": -3, "health_score_delta": 8},
            },
            {
                "name": "Beta",
                "health": "critical",
                "health_score": 30,
                "status_report": {"coverage": "missing"},
                "issues": {"overdue": 4},
                "support": {"overdue_count": 1},
                "period_compare": {"available": False},
            },
        ]
        wins, risks = build_qbr_wins_risks(clients)
        assert any("Alpha" in win for win in wins)
        assert any("Beta" in risk for risk in risks)


class TestQbrMarkdown:
    def test_github_friendly_markdown(self):
        period = WeekPeriod(start=date(2026, 3, 2), end=date(2026, 3, 8))
        payload = build_qbr_payload(
            QbrBuildInput(
                scope="portfolio",
                workspace_name="Acme",
                period=period,
                weeks_requested=13,
                summary={
                    "total_clients": 2,
                    "health_critical": 1,
                    "report_missing": 0,
                    "total_overdue": 3,
                    "total_support_open": 1,
                },
                period_compare=None,
                clients=[
                    {
                        "name": "Cliente A",
                        "health": "ok",
                        "health_score": 75,
                        "status_report": {"coverage": "complete"},
                        "issues": {"overdue": 1},
                    }
                ],
                chart_warnings=[],
                matrix_weeks=[
                    {"period_start": "2026-03-02", "period_end": "2026-03-08"},
                ],
                matrix_cells=[
                    {"period_start": "2026-03-02", "coverage": "complete"},
                    {"period_start": "2026-03-02", "coverage": "partial"},
                ],
            )
        )
        md = qbr_to_markdown(payload)
        assert md.startswith("# QBR Carteira — Acme")
        assert "## Matriz resumo" in md
        assert "| Semana | Completo |" in md
        assert "13 semanas" in md

    def test_narrative_sections_in_markdown(self):
        period = WeekPeriod(start=date(2026, 3, 2), end=date(2026, 3, 8))
        payload = build_qbr_payload(
            QbrBuildInput(
                scope="client",
                workspace_name="Acme",
                period=period,
                weeks_requested=13,
                summary={},
                period_compare=None,
                clients=[],
                chart_warnings=[],
                client_detail={"name": "Cliente A"},
                narrative={"wins_md": "Win grande", "risks_md": "Risco X", "next_steps_md": "Próximo passo"},
            )
        )
        md = qbr_to_markdown(payload)
        assert "## Wins (narrativa)" in md
        assert "Win grande" in md
        assert "## Riscos (narrativa)" in md

    def test_thirteen_week_matrix_summary(self):
        weeks = [
            {"period_start": f"2026-01-{day:02d}", "period_end": f"2026-01-{day+6:02d}"}
            for day in range(1, 14)
        ]
        cells = [{"period_start": week["period_start"], "coverage": "complete"} for week in weeks]
        summary = build_qbr_matrix_summary(weeks, cells)
        assert len(summary) == 13
