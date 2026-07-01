from __future__ import annotations

from datetime import date

from operoz.utils.status_report_export import (
    StatusReportExportContext,
    content_to_html,
    parse_module_display_name,
    resolve_report_client_label,
)


def test_parse_module_display_name_extracts_client():
    raw = "[ ALLIANZ ] [ EMISSÃO MANUAL ] [ IBLBDM-52166 ] - Descrição / nome do produto"
    parsed = parse_module_display_name(raw)
    assert parsed["client"] == "ALLIANZ"
    assert parsed["code"] == "IBLBDM-52166"


def test_resolve_report_client_label_prefers_bracket_client():
    label = resolve_report_client_label(
        "[ ALLIANZ ] [ CAT ] [ CODE ] - 'Produto'",
        "Cliente Projeto",
    )
    assert label == "ALLIANZ"


def test_content_to_html_preserves_full_module_name_in_item_cell():
    module_name = "[ ALLIANZ ] [ EMISSÃO MANUAL ] [ IBLBDM-52166 ] - Descrição / nome do produto"
    ctx = StatusReportExportContext(
        title=module_name,
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="Cliente Report",
        module_name=module_name,
        board_name=None,
        content={
            "report_kind": "sprint",
            "sections": {
                "entregas_sprint": [
                    {
                        "item_label": module_name,
                        "data_inicio": "21/04/2026",
                        "data_entrega_etapa": "A definir",
                        "etapa_atual": "—",
                        "pct_total": "58",
                    }
                ],
                "progress": {"pct": 58, "omitir_global": False},
                "report_row": {
                    "produto": module_name,
                    "client_name": "ALLIANZ",
                    "consultor": "Anderson Silveira",
                    "responsavel_cliente": "—",
                    "inicio": "21/04/2026",
                    "fim": "A definir",
                },
                "observacoes": {"em_execucao": [], "pontos_atencao": []},
                "executive_summary": {"html": "<p>Entrega principal concluída na semana.</p>"},
            },
        },
    )
    html = content_to_html(ctx)
    assert '<h1 class="sr-page__hero-title">ALLIANZ</h1>' in html
    assert "Sprint · 1 módulo ·" in html
    assert "Resumo executivo" in html
    assert module_name in html
    assert "white-space: nowrap" in html
    assert "font-size: 9.5px" in html
    assert "% total do item" in html
    assert "sr-table__cell--compact" in html


def test_content_to_html_cronograma_shows_total_pct_badge():
    ctx = StatusReportExportContext(
        title="ALLIANZ",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="ALLIANZ",
        module_name="mod",
        board_name=None,
        content={
            "report_kind": "sprint",
            "sections": {
                "entregas_sprint": [],
                "progress": {"pct": 44, "omitir_global": False},
                "observacoes": {"em_execucao": [], "pontos_atencao": [], "proximos_passos": []},
            },
        },
    )
    html = content_to_html(ctx)
    assert 'class="sr-evo-card__pct"' in html
    assert ">44%</div>" in html
    assert "Média do avanço das etapas do cronograma (sprint)." in html
    assert "(sprint): 44%" not in html


def test_content_to_html_renders_proximos_passos_card():
    ctx = StatusReportExportContext(
        title="ALLIANZ",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="ALLIANZ",
        module_name="mod",
        board_name=None,
        content={
            "report_kind": "sprint",
            "sections": {
                "entregas_sprint": [],
                "progress": {"pct": 44, "omitir_global": False},
                "observacoes": {
                    "em_execucao": ["Deploy em homologação"],
                    "pontos_atencao": ["Aguardando cliente"],
                    "proximos_passos": ["Go-live na FG"],
                },
            },
        },
    )
    html = content_to_html(ctx)
    assert "sr-obs-card--next" in html
    assert "Próximos passos" in html
    assert "Go-live na FG" in html


def test_content_to_html_sprint_shows_sprint_tag_beside_consultor():
    ctx = StatusReportExportContext(
        title="Sprint 4",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="ALLIANZ",
        module_name="mod",
        board_name=None,
        consultor_name="Anderson Silveira",
        content={
            "report_kind": "sprint",
            "sections": {
                "entregas_sprint": [],
                "progress": {"pct": 12, "omitir_global": False},
                "report_row": {"consultor": "Anderson Silveira"},
                "sprint": {"label": "Sprint 4", "period_label": "2026-06-22 — 2026-06-28"},
                "observacoes": {"em_execucao": [], "pontos_atencao": [], "proximos_passos": []},
            },
        },
    )
    html = content_to_html(ctx)
    assert "sr-head-cell--sprint" in html
    assert '<span class="sr-head-label">Sprint</span>' in html
    assert 'sr-head-val--sprint">4</span>' in html
    assert "Anderson Silveira" in html
    assert html.index("sr-head-cell--sprint") < html.index("Consultor</span>")



def test_content_to_html_etapa_table_auto_sizing():
    ctx = StatusReportExportContext(
        title="ALLIANZ",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="ALLIANZ",
        module_name="mod",
        board_name=None,
        content={
            "report_kind": "module_single",
            "sections": {
                "entregas": [
                    {
                        "etapa": "Imersão",
                        "data_inicio": "15/05/2023",
                        "data_entrega": "A definir",
                        "pct": "100",
                    },
                    {
                        "etapa": "Desenvolvimento",
                        "data_inicio": "A definir",
                        "data_entrega": "A definir",
                        "pct": "0",
                    },
                ],
                "progress": {"pct": 62, "omitir_global": False},
                "observacoes": {"em_execucao": [], "pontos_atencao": [], "proximos_passos": []},
            },
        },
    )
    html = content_to_html(ctx)
    assert 'class="sr-table sr-table--etapas"' in html
    assert "<colgroup>" in html
    assert "sr-table__cell--stage" in html
    assert "Entregas do projeto" in html


def test_content_to_html_multi_module_has_no_sprint_column():
    ctx = StatusReportExportContext(
        title="ALLIANZ",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="ALLIANZ",
        module_name="mod",
        board_name=None,
        consultor_name="Anderson Silveira",
        content={
            "report_kind": "multi_module",
            "module_ids": ["1", "2"],
            "sections": {
                "entregas_sprint": [],
                "progress": {"pct": 12, "omitir_global": False},
                "report_row": {"consultor": "Anderson Silveira"},
                "observacoes": {"em_execucao": [], "pontos_atencao": [], "proximos_passos": []},
            },
        },
    )
    html = content_to_html(ctx)
    assert "sr-head-cell--sprint" not in html
    assert "Módulos no período" in html
    assert "Evolução dos módulos" in html
    assert "2 módulos ·" in html


def test_content_to_html_sprint_subtitle_module_count():
    module_a = "[ ALLIANZ ] [ CAT ] [ A-1 ] - Mod A"
    module_b = "[ ALLIANZ ] [ CAT ] [ B-2 ] - Mod B"
    ctx = StatusReportExportContext(
        title="ALLIANZ",
        period_start=date(2026, 6, 22),
        period_end=date(2026, 6, 28),
        project_name="Cliente Report",
        module_name=module_a,
        board_name=None,
        content={
            "report_kind": "sprint",
            "module_ids": ["1", "2"],
            "sections": {
                "entregas_sprint": [
                    {"item_label": module_a, "data_inicio": "—", "data_entrega_etapa": "—", "etapa_atual": "—", "pct_total": "10"},
                    {"item_label": module_b, "data_inicio": "—", "data_entrega_etapa": "—", "etapa_atual": "—", "pct_total": "20"},
                ],
                "progress": {"pct": 15, "omitir_global": False},
                "observacoes": {"em_execucao": [], "pontos_atencao": []},
            },
        },
    )
    html = content_to_html(ctx)
    assert "Sprint · 2 módulos · 22/06/2026 a 28/06/2026" in html
    assert module_a in html
    assert module_b in html
