"""Exportação Status Report (HTML / Markdown / PDF) — layout Magalu."""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from datetime import date
from typing import Any

CONTENT_SCHEMA_VERSION = 3

DEFAULT_ETAPAS = [
    "Imersão",
    "Protótipo",
    "Aprovação documentação projeto",
    "Kickoff",
    "Desenvolvimento",
    "Homologação interna",
    "Homologação externa",
    "Deploy",
    "Operação assistida",
    "Sustentação",
]


@dataclass
class StatusReportExportContext:
    title: str
    period_start: date
    period_end: date
    project_name: str | None
    module_name: str | None
    board_name: str | None
    content: dict
    consultor_name: str | None = None
    responsavel_cliente: str | None = None
    module_start: date | None = None
    module_target: date | None = None


def _esc(value: Any) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def parse_module_display_name(raw: str) -> dict[str, str]:
    """Extrai cliente / categoria / código de nomes `[ CLIENT ] [ CAT ] [ ID ] - 'Título'`."""
    text = raw or ""
    bracket_matches = [match.group(1).strip() for match in re.finditer(r"\[\s*([^\]]+?)\s*\]", text)]
    quote_match = re.search(r"['\"]([^'\"]+)['\"]", text)
    quoted_title = quote_match.group(1).strip() if quote_match else None

    if len(bracket_matches) >= 3:
        return {
            "client": bracket_matches[0],
            "category": bracket_matches[1],
            "code": bracket_matches[2],
            "title": quoted_title or text,
            "subtitle": " · ".join(bracket_matches[:3]),
        }
    if len(bracket_matches) == 2:
        return {
            "client": bracket_matches[0],
            "category": bracket_matches[1],
            "title": quoted_title or text,
            "subtitle": f"{bracket_matches[0]} · {bracket_matches[1]}",
        }
    if len(bracket_matches) == 1:
        return {
            "client": bracket_matches[0],
            "title": quoted_title or text,
            "subtitle": bracket_matches[0],
        }
    return {"title": text}


def resolve_report_client_label(
    module_name: str | None,
    project_name: str | None = None,
) -> str:
    if module_name and module_name.strip():
        client = parse_module_display_name(module_name).get("client")
        if client:
            return client
    if project_name and str(project_name).strip():
        return str(project_name).strip()
    if module_name and module_name.strip():
        return module_name.strip()
    return "—"


def _table_item_cell_html(raw_label: str) -> str:
    full = (raw_label or "").strip() or "—"
    return f'<td class="sr-table__item"><span class="sr-table__item-text">{_esc(full)}</span></td>'


def _parse_pct_value(raw: Any) -> int | None:
    if raw is None or raw == "" or raw == "—":
        return None
    try:
        return min(100, max(0, int(float(str(raw).replace("%", "").strip()))))
    except (TypeError, ValueError):
        return None


def _pct_cell_html(pct_raw: Any, *, omit: bool = False) -> str:
    if omit:
        return '<td class="sr-table__cell sr-table__cell--compact sr-table__cell--pct">—</td>'
    pct = _parse_pct_value(pct_raw)
    if pct is None:
        return '<td class="sr-table__cell sr-table__cell--compact sr-table__cell--pct">—</td>'
    return (
        f'<td class="sr-table__cell sr-table__cell--compact sr-table__cell--pct">'
        f'<span class="sr-table__pct-val">{pct}%</span></td>'
    )


def _date_cell_html(value: Any) -> str:
    return (
        f'<td class="sr-table__cell sr-table__cell--compact sr-table__cell--date">'
        f"{_esc(value if value not in (None, '') else '—')}</td>"
    )


def _resolve_hero_title(ctx: StatusReportExportContext) -> str:
    rr = _report_row(ctx)
    client = rr.get("client_name")
    if client and client != "—":
        return client
    if ctx.project_name and str(ctx.project_name).strip():
        return str(ctx.project_name).strip()
    if ctx.title and str(ctx.title).strip():
        return str(ctx.title).strip()
    return "Status report"


def _resolve_hero_subtitle(ctx: StatusReportExportContext) -> str:
    period = f"{_format_date_br(ctx.period_start)} a {_format_date_br(ctx.period_end)}"
    kind = _report_kind(ctx)
    if kind in ("sprint", "multi_module"):
        count = _module_row_count(ctx)
        if kind == "sprint":
            sprint_prefix = _resolve_sprint_label(ctx) or "Sprint"
            if count > 1:
                return f"{sprint_prefix} · {count} módulos · {period}"
            if count == 1:
                return f"{sprint_prefix} · 1 módulo · {period}"
            return f"{sprint_prefix} · {period}"
        if count > 1:
            return f"{count} módulos · {period}"
        if count == 1:
            return f"1 módulo · {period}"
        return f"Seleção de módulos · {period}"
    return f"Report semanal · {period}"


def _executive_summary_body(ctx: StatusReportExportContext) -> str:
    summary = (_sections(ctx).get("executive_summary") or {}).get("html") or ""
    return summary.strip()


def _render_executive_summary_section(ctx: StatusReportExportContext) -> str:
    summary = _executive_summary_body(ctx)
    if not summary:
        return ""
    plain = _strip_html_to_plain(summary)
    if not plain:
        return ""
    body = summary if "<" in summary and ">" in summary else _md_bold_to_html(summary)
    return f"""
      <div class="sr-section-block sr-section-block--spaced">
        <div class="sr-section-accent" aria-hidden="true"></div>
        <h2 class="sr-section-title">Resumo executivo</h2>
        <div class="sr-summary">{body}</div>
      </div>
    """


def _format_date_br(iso_date: str | date) -> str:
    if isinstance(iso_date, date):
        d = iso_date
    else:
        d = date.fromisoformat(str(iso_date)[:10])
    return d.strftime("%d/%m/%Y")


def _module_date_label(value: str | date | None) -> str:
    if value is None or value == "":
        return "A definir"
    return _format_date_br(value)


def entrega_date_label(value: str | date | None) -> str:
    """Data de início/fim numa linha de entregas (cards do módulo)."""
    return _module_date_label(value)


def max_module_target_date(modules) -> date | None:
    """Maior data-alvo entre módulos (cabeçalho FIM em reports sprint/multi-módulo)."""
    targets = [module.target_date for module in modules if getattr(module, "target_date", None)]
    return max(targets) if targets else None


def default_entregas_rows() -> list[dict]:
    return [
        {
            "etapa": name,
            "pct": "0",
            "mostrar_pct": False,
            "data_inicio": "A definir",
            "data_entrega": "A definir",
        }
        for name in DEFAULT_ETAPAS
    ]


def default_observacoes_block() -> dict:
    return {"em_execucao": [], "pontos_atencao": [], "proximos_passos": []}


def user_consultor_label(user) -> str:
    """Consultor = nome de exibição; fallback nome+sobrenome, depois e-mail."""
    from operoz.utils.user_display import user_display_label

    return user_display_label(user)


def project_responsavel_cliente_label(project) -> str:
    """Stakeholder responsável definido no projeto."""
    if project is None:
        return "—"
    value = (getattr(project, "responsible_stakeholder", None) or "").strip()
    return value or "—"


def _display_label(*candidates: str | None) -> str:
    """Primeiro valor utilizável; ignora vazio e placeholder «—»."""
    for candidate in candidates:
        if candidate is None:
            continue
        text = str(candidate).strip()
        if text and text != "—":
            return text
    return "—"


def enrich_module_report_sections(
    *,
    sections: dict,
    module_name: str,
    project_name: str,
    module_start: date | None,
    module_target: date | None,
    consultor_name: str | None,
    responsavel_cliente: str | None,
    metrics: dict,
) -> dict:
    mod = sections.setdefault("module", {"id": "", "name": module_name})
    if module_start:
        mod["start_date"] = module_start.isoformat()
    if module_target:
        mod["target_date"] = module_target.isoformat()
    sections.setdefault("report_row", {})
    rr = sections["report_row"]
    rr.setdefault("produto", module_name)
    rr.setdefault("client_name", resolve_report_client_label(module_name, project_name))
    rr.setdefault("consultor", consultor_name or "—")
    rr.setdefault("responsavel_cliente", responsavel_cliente or "—")
    rr.setdefault("inicio", _module_date_label(module_start))
    rr.setdefault("fim", _module_date_label(module_target))
    if "entregas" not in sections:
        sections["entregas"] = default_entregas_rows()
    if not sections.get("observacoes"):
        sections["observacoes"] = default_observacoes_block()
    obs = sections["observacoes"]
    obs.setdefault("em_execucao", [])
    obs.setdefault("pontos_atencao", [])
    obs.setdefault("proximos_passos", [])
    entregas = sections.get("entregas") or []
    if entregas:
        from operoz.utils.board_status_report import progress_pct_from_entregas

        pct = progress_pct_from_entregas(entregas)
    else:
        pct = 0
    sections.setdefault("progress", {"pct": pct, "omitir_global": False})
    sections.setdefault("executive_summary", {"html": ""})
    return sections


def _sections(ctx: StatusReportExportContext) -> dict:
    return (ctx.content or {}).get("sections") or {}


def _resolve_module_boundary(
    ctx: StatusReportExportContext,
    *,
    boundary: str,
) -> str:
    """Início/fim do módulo (não confundir com período do report semanal)."""
    sections = _sections(ctx)
    mod = sections.get("module") or {}
    rr = sections.get("report_row") or {}

    if boundary == "start":
        if ctx.module_start:
            return _format_date_br(ctx.module_start)
        if mod.get("start_date"):
            return _format_date_br(mod["start_date"])
        stored = rr.get("inicio")
        if stored and stored not in ("—", ""):
            return str(stored)
        return "A definir"

    if ctx.module_target:
        return _format_date_br(ctx.module_target)
    if mod.get("target_date"):
        return _format_date_br(mod["target_date"])
    stored = rr.get("fim")
    if stored and stored not in ("—", ""):
        return str(stored)
    return "A definir"


def _resolve_sprint_label(ctx: StatusReportExportContext) -> str | None:
    if _report_kind(ctx) != "sprint":
        return None
    title = (ctx.title or "").strip()
    if title:
        return title
    sprint = _sections(ctx).get("sprint") or {}
    label = (sprint.get("label") or "").strip()
    return label or None


def _format_sprint_head_value(label: str) -> str:
    text = (label or "").strip()
    if not text:
        return "—"
    match = re.search(r"(?i)sprint\s*#?\s*(\d+)", text)
    if match:
        return match.group(1)
    trailing = re.search(r"(\d+)\s*$", text)
    if trailing:
        return trailing.group(1)
    return text


def _render_head_grid_html(ctx: StatusReportExportContext, rr: dict) -> str:
    sprint_label = _resolve_sprint_label(ctx)
    consultor_cell = (
        f'<div class="sr-head-cell">'
        f'<span class="sr-head-label">Consultor</span>'
        f'<span class="sr-head-val">{_esc(rr["consultor"])}</span>'
        f"</div>"
    )
    sprint_cell = ""
    if sprint_label:
        sprint_cell = (
            f'<div class="sr-head-cell sr-head-cell--sprint">'
            f'<span class="sr-head-label">Sprint</span>'
            f'<span class="sr-head-val sr-head-val--sprint">{_esc(_format_sprint_head_value(sprint_label))}</span>'
            f"</div>"
        )
    tail_cells = (
        f'<div class="sr-head-cell">'
        f'<span class="sr-head-label">Responsável cliente</span>'
        f'<span class="sr-head-val">{_esc(rr["responsavel_cliente"])}</span>'
        f"</div>"
        f'<div class="sr-head-cell">'
        f'<span class="sr-head-label">Início</span>'
        f'<span class="sr-head-val">{_esc(rr["inicio"])}</span>'
        f"</div>"
        f'<div class="sr-head-cell">'
        f'<span class="sr-head-label">Fim</span>'
        f'<span class="sr-head-val">{_esc(rr["fim"])}</span>'
        f"</div>"
    )
    grid_class = "sr-head-grid sr-head-grid--sprint" if sprint_label else "sr-head-grid"
    return f'<div class="{grid_class}">{sprint_cell}{consultor_cell}{tail_cells}</div>'


def _report_row(ctx: StatusReportExportContext) -> dict:
    sections = _sections(ctx)
    rr = sections.get("report_row") or {}
    client_name = _display_label(
        rr.get("client_name"),
        resolve_report_client_label(ctx.module_name, ctx.project_name),
    )
    return {
        "produto": rr.get("produto") or ctx.module_name or "—",
        "client_name": client_name,
        "consultor": _display_label(ctx.consultor_name, rr.get("consultor")),
        "responsavel_cliente": _display_label(ctx.responsavel_cliente, rr.get("responsavel_cliente")),
        "inicio": _resolve_module_boundary(ctx, boundary="start"),
        "fim": _resolve_module_boundary(ctx, boundary="end"),
    }


def _observacoes(ctx: StatusReportExportContext) -> dict:
    obs = _sections(ctx).get("observacoes") or {}
    return {
        "em_execucao": obs.get("em_execucao") or [],
        "pontos_atencao": obs.get("pontos_atencao") or [],
        "proximos_passos": obs.get("proximos_passos") or [],
    }


def _md_bold_to_html(text: str) -> str:
    escaped = _esc(text)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)


def _strip_html_to_plain(text: str) -> str:
    if "<" not in text or ">" not in text:
        return text.strip()
    cleaned = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    cleaned = re.sub(r"</p>", "\n", cleaned, flags=re.I)
    cleaned = re.sub(r"<[^>]+>", "", cleaned)
    return html.unescape(cleaned).strip()


def _observation_line_html(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    if "<" in text and ">" in text:
        return re.sub(r"\s*border-left:\s*[^;\"']+;?", "", text, flags=re.I)
    return _md_bold_to_html(text)


def _lines_to_md_list(items: list) -> list[str]:
    lines: list[str] = []
    for item in items:
        text = str(item).strip() if not isinstance(item, dict) else str(item.get("text", "")).strip()
        if not text:
            continue
        plain = _strip_html_to_plain(text)
        if plain.startswith("- "):
            lines.append(plain)
        else:
            lines.append(f"- {plain}")
    return lines


def _report_kind(ctx: StatusReportExportContext) -> str | None:
    content = ctx.content or {}
    report_kind = content.get("report_kind")
    if report_kind:
        return report_kind
    sections = _sections(ctx)
    if sections.get("entregas_sprint"):
        return "sprint"
    return "module_single"


def _uses_module_row_table(report_kind: str | None) -> bool:
    return report_kind in ("sprint", "multi_module")


def _module_row_count(ctx: StatusReportExportContext) -> int:
    sections = _sections(ctx)
    count = len(sections.get("entregas_sprint") or [])
    module_ids = (ctx.content or {}).get("module_ids") or []
    if module_ids:
        count = max(count, len(module_ids))
    return count


_ENTREGAS_ITEM_TABLE_COLGROUP = (
    "<colgroup>"
    '<col class="sr-table__col-item" />'
    '<col class="sr-table__col-date" />'
    '<col class="sr-table__col-date" />'
    '<col class="sr-table__col-stage" />'
    '<col class="sr-table__col-pct" />'
    "</colgroup>"
)

_ENTREGAS_ITEM_TABLE_HEAD = (
    '<tr><th class="sr-table__th-item">Item</th>'
    '<th class="sr-table__th-compact">Início</th>'
    '<th class="sr-table__th-compact">Entrega (etapa)</th>'
    '<th class="sr-table__th-compact">Etapa atual</th>'
    '<th class="sr-table__th-compact sr-table__th-pct">% total do item</th></tr>'
)

_ENTREGAS_ETAPA_TABLE_COLGROUP = (
    "<colgroup>"
    '<col class="sr-table__col-stage" />'
    '<col class="sr-table__col-date" />'
    '<col class="sr-table__col-date" />'
    '<col class="sr-table__col-pct" />'
    "</colgroup>"
)


_ENTREGAS_ETAPA_TABLE_HEAD = (
    "<tr>"
    '<th class="sr-table__th-stage">Etapa</th>'
    '<th class="sr-table__th-date">Início</th>'
    '<th class="sr-table__th-date">Entrega</th>'
    '<th class="sr-table__th-pct">Avanço</th>'
    "</tr>"
)


def _render_entregas_table_html(ctx: StatusReportExportContext) -> tuple[str, str, str, str, str]:
    """Retorna (título, classe da tabela, colgroup html, thead html, tbody html)."""
    sections = _sections(ctx)
    report_kind = _report_kind(ctx)

    if _uses_module_row_table(report_kind):
        title = "Entregas da sprint" if report_kind == "sprint" else "Módulos no período"
        table_class = "sr-table sr-table--items"
        thead = _ENTREGAS_ITEM_TABLE_HEAD
        tbody = ""
        for row in sections.get("entregas_sprint") or []:
            tbody += (
                f"<tr>{_table_item_cell_html(str(row.get('item_label', '')))}"
                f"{_date_cell_html(row.get('data_inicio'))}"
                f"{_date_cell_html(row.get('data_entrega_etapa'))}"
                f'<td class="sr-table__cell sr-table__cell--compact">{_esc(row.get("etapa_atual", "—"))}</td>'
                f"{_pct_cell_html(row.get('pct_total', '0'))}</tr>"
            )
        return title, table_class, "", thead, tbody

    entregas = sections.get("entregas") or []
    uses_item_label = any(row.get("item_label") for row in entregas)
    if uses_item_label:
        title = "Entregas do projeto"
        table_class = "sr-table sr-table--items"
        thead = _ENTREGAS_ITEM_TABLE_HEAD
        tbody = ""
        for row in entregas:
            omit_pct = row.get("mostrar_pct") is False
            tbody += (
                f"<tr>{_table_item_cell_html(str(row.get('item_label') or row.get('etapa', '')))}"
                f"{_date_cell_html(row.get('data_inicio'))}"
                f"{_date_cell_html(row.get('data_entrega'))}"
                f'<td class="sr-table__cell sr-table__cell--compact">{_esc(row.get("etapa_atual") or row.get("etapa", "—"))}</td>'
                f"{_pct_cell_html(row.get('pct', '0'), omit=omit_pct)}</tr>"
            )
        return title, table_class, "", thead, tbody

    title = "Entregas do projeto"
    table_class = "sr-table sr-table--etapas"
    colgroup = _ENTREGAS_ETAPA_TABLE_COLGROUP
    thead = _ENTREGAS_ETAPA_TABLE_HEAD
    tbody = ""
    for row in entregas:
        omit_pct = row.get("mostrar_pct") is False
        tbody += (
            f'<tr><td class="sr-table__cell sr-table__cell--stage">'
            f"{_esc(row.get('etapa', ''))}</td>"
            f"{_date_cell_html(row.get('data_inicio'))}"
            f"{_date_cell_html(row.get('data_entrega'))}"
            f"{_pct_cell_html(row.get('pct', '0'), omit=omit_pct)}</tr>"
        )
    return title, table_class, colgroup, thead, tbody


def _render_entregas_table_markdown(ctx: StatusReportExportContext) -> list[str]:
    sections = _sections(ctx)
    report_kind = _report_kind(ctx)
    lines: list[str] = []

    if _uses_module_row_table(report_kind):
        rows = sections.get("entregas_sprint") or []
        if not rows:
            return lines
        section_title = "Entregas da sprint" if report_kind == "sprint" else "Módulos no período"
        lines.extend(
            [
                f"## {section_title}",
                "",
                "| Item | Início | Entrega (etapa) | Etapa atual | % total |",
                "| --- | --- | --- | --- | --- |",
            ]
        )
        for row in rows:
            lines.append(
                f"| {row.get('item_label', '')} | {row.get('data_inicio', '—')} | "
                f"{row.get('data_entrega_etapa', '—')} | {row.get('etapa_atual', '—')} | "
                f"{row.get('pct_total', '0')}% |"
            )
        lines.append("")
        return lines

    entregas = sections.get("entregas") or []
    if not entregas:
        return lines

    uses_item_label = any(row.get("item_label") for row in entregas)
    if uses_item_label:
        lines.extend(
            [
                "## Entregas do projeto",
                "",
                "| Item | Início | Entrega (etapa) | Etapa atual | % total |",
                "| --- | --- | --- | --- | --- |",
            ]
        )
        for row in entregas:
            pct_txt = "—" if row.get("mostrar_pct") is False else f"{row.get('pct', 0)}%"
            lines.append(
                f"| {row.get('item_label') or row.get('etapa', '')} | {row.get('data_inicio', '—')} | "
                f"{row.get('data_entrega', '—')} | {row.get('etapa_atual') or row.get('etapa', '—')} | {pct_txt} |"
            )
    else:
        lines.extend(
            [
                "## Entregas do projeto",
                "",
                "| Etapa | Início | Entrega | Avanço |",
                "| --- | --- | --- | --- |",
            ]
        )
        for row in entregas:
            pct_txt = "—" if row.get("mostrar_pct") is False else f"{row.get('pct', 0)}%"
            lines.append(
                f"| {row.get('etapa', '')} | {row.get('data_inicio', '—')} | "
                f"{row.get('data_entrega', '—')} | {pct_txt} |"
            )
    lines.append("")
    return lines


def content_to_markdown(ctx: StatusReportExportContext) -> str:
    sections = _sections(ctx)
    rr = _report_row(ctx)
    obs = _observacoes(ctx)
    progress = sections.get("progress") or {}
    pct = progress.get("pct", 0)

    sprint_label = _resolve_sprint_label(ctx)

    lines = [
        f"# {_resolve_hero_title(ctx)}",
        "",
        f"**Projeto:** {ctx.project_name or '—'}",
        f"**Módulo:** {rr['produto']}",
    ]
    if sprint_label:
        lines.append(f"**Sprint:** {sprint_label}")
    lines.extend(
        [
            f"**Consultor:** {rr['consultor']}",
            f"**Responsável cliente:** {rr['responsavel_cliente']}",
            f"**Início:** {rr['inicio']} · **Fim:** {rr['fim']}",
            f"**Report semanal:** {_format_date_br(ctx.period_start)} a {_format_date_br(ctx.period_end)}",
            "",
        ]
    )

    summary = (sections.get("executive_summary") or {}).get("html") or ""
    if summary.strip():
        lines.extend(["## Resumo executivo", "", summary.strip(), ""])

    if not progress.get("omitir_global", False):
        kind = _report_kind(ctx)
        if kind == "sprint":
            cronograma_label = "Evolução da sprint"
        elif kind == "multi_module":
            cronograma_label = "Evolução dos módulos"
        else:
            cronograma_label = "Evolução do projeto"
        lines.extend(["## Cronograma", "", f"**{cronograma_label}:** {pct}%", ""])

    lines.extend(_render_entregas_table_markdown(ctx))

    week_label = f"Semana de {_format_date_br(ctx.period_start)} a {_format_date_br(ctx.period_end)}"
    lines.extend([f"## Observações — {week_label}", ""])

    lines.append("### Em execução")
    lines.append("")
    em_lines = _lines_to_md_list(obs["em_execucao"])
    lines.extend(em_lines if em_lines else ["- —"])
    lines.append("")

    lines.append("### Pontos de atenção")
    lines.append("")
    pa_lines = _lines_to_md_list(obs["pontos_atencao"])
    lines.extend(pa_lines if pa_lines else ["- —"])
    lines.append("")

    lines.append("### Próximos passos")
    lines.append("")
    pp_lines = _lines_to_md_list(obs["proximos_passos"])
    lines.extend(pp_lines if pp_lines else ["- —"])
    lines.append("")

    return "\n".join(lines).strip() + "\n"


def _cronograma_hint(pct: int, *, report_kind: str | None = None) -> str:
    if report_kind == "sprint":
        label = "sprint"
    elif report_kind == "multi_module":
        label = "módulos selecionados"
    else:
        label = "projeto"
    if pct <= 0:
        return "Percentual médio do cronograma será definido após o encerramento da imersão."
    if report_kind == "multi_module":
        return f"Média do avanço das etapas dos {label}."
    return f"Média do avanço das etapas do cronograma ({label})."


def _render_cronograma_section(pct: int, *, report_kind: str | None = None) -> str:
    hint = _esc(_cronograma_hint(pct, report_kind=report_kind))
    if report_kind == "sprint":
        evolution_label = "Evolução da sprint"
    elif report_kind == "multi_module":
        evolution_label = "Evolução dos módulos"
    else:
        evolution_label = "Evolução do projeto"
    return f"""
      <div class="sr-section-block">
        <div class="sr-section-accent" aria-hidden="true"></div>
        <h2 class="sr-section-title">Cronograma</h2>
      <section class="sr-evo-card" data-sr-template="cronograma-v2" aria-label="{_esc(evolution_label)}">
        <div class="sr-evo-card__head">
          <div class="sr-evo-card__copy">
            <div class="sr-evo-card__label">{_esc(evolution_label)}</div>
            <p class="sr-evo-card__hint">{hint}</p>
          </div>
          <div class="sr-evo-card__pct" aria-label="Percentual total">{pct}%</div>
        </div>
        <div class="sr-evo-card__track-wrap">
          <div class="sr-evo-card__track" role="progressbar" aria-valuenow="{pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="sr-evo-card__fill" style="width:{pct}%"></div>
          </div>
          <div class="sr-evo-card__scale" aria-hidden="true">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </section>
      </div>
    """


def _observation_is_rich_html(text: str) -> bool:
    t = text.strip()
    return "<" in t and ">" in t and any(tag in t.lower() for tag in ("<ul", "<ol", "<p", "<div", "<blockquote"))


def _render_obs_list(items: list, css_class: str) -> str:
    parts = []
    for item in items:
        text = str(item).strip() if not isinstance(item, dict) else str(item.get("text", "")).strip()
        if not text:
            continue
        body = _observation_line_html(text)
        rich_class = " sr-obs-line__text--rich" if _observation_is_rich_html(text) else ""
        parts.append(
            f'<div class="sr-obs-line"><span class="sr-obs-line__mark" aria-hidden="true"></span>'
            f'<span class="sr-obs-line__text{rich_class}">{body}</span></div>'
        )
    if not parts:
        parts.append(
            '<div class="sr-obs-line"><span class="sr-obs-line__mark" aria-hidden="true"></span>'
            '<span class="sr-obs-line__text">—</span></div>'
        )
    return "".join(parts)


def content_to_html(ctx: StatusReportExportContext, *, for_pdf: bool = False) -> str:
    sections = _sections(ctx)
    rr = _report_row(ctx)
    obs = _observacoes(ctx)
    progress = sections.get("progress") or {}
    pct = min(100, max(0, int(progress.get("pct") or 0)))
    show_progress = not progress.get("omitir_global", False)

    entregas_title, entregas_table_class, entregas_colgroup, entregas_table_head, entregas_table_body = (
        _render_entregas_table_html(ctx)
    )
    report_kind = _report_kind(ctx)
    hero_title = _resolve_hero_title(ctx)
    hero_subtitle = _resolve_hero_subtitle(ctx)
    summary_section = _render_executive_summary_section(ctx)

    em_html = _render_obs_list(obs["em_execucao"], "exec")
    pa_html = _render_obs_list(obs["pontos_atencao"], "pa")
    pp_html = _render_obs_list(obs["proximos_passos"], "next")
    head_grid_html = _render_head_grid_html(ctx, rr)

    print_btn = ""
    if not for_pdf:
        print_btn = '<button type="button" class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>'

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{_esc(hero_title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root {{ --em-exec: #00d386; --pontos: #ff4a4a; --proximos: #3b82f6; --ink: #0f172a; --muted: #64748b; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: Inter, sans-serif; background: #eceff1; color: var(--ink); font-size: 12.5px; line-height: 1.35; }}
    .sr-topbar {{ max-width: 64rem; margin: 0.75rem auto; display: flex; gap: 0.5rem; }}
    .btn-print {{ background: #37474f; color: #fff; border: none; padding: 0.45rem 0.85rem; border-radius: 4px; font-weight: 600; cursor: pointer; }}
    .sr-page {{ max-width: 64rem; margin: 0 auto 2rem; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,.08); border: 1px solid #e8ecef; }}
    .sr-page__accent {{ height: 5px; background: #00b8a9; }}
    .sr-page__hero {{ padding: 1.25rem 1.35rem; background: #f0f9f8; border-bottom: 1px solid rgba(0,184,169,.12); }}
    .sr-page__hero-kicker {{ font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #9e9e9e; margin-bottom: .4rem; }}
    .sr-page__hero-title {{ font-size: 1.35rem; font-weight: 700; }}
    .sr-page__hero-week {{ margin-top: .45rem; font-size: 11px; color: var(--muted); font-weight: 600; }}
    .sr-summary {{
      border: 1px solid #e8ecef;
      border-radius: 10px;
      background: #f8fafb;
      padding: 1rem 1.1rem;
      font-size: 12px;
      line-height: 1.5;
      color: #334155;
    }}
    .sr-summary p {{ margin: 0 0 .5rem; }}
    .sr-summary p:last-child {{ margin-bottom: 0; }}
    .sr-summary ul, .sr-summary ol {{ margin: .35rem 0; padding-left: 1.4rem; }}
    .sr-head-grid {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0;
      padding: 0;
      border-bottom: 1px solid #e8ecef;
    }}
    .sr-head-grid--sprint {{
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }}
    .sr-head-cell {{
      padding: .95rem 1rem 1rem;
      text-align: center;
      border-right: 1px solid #eef2f6;
    }}
    .sr-head-cell:last-child {{
      border-right: none;
    }}
    .sr-head-cell--sprint {{
      background: linear-gradient(180deg, #f8fcfb 0%, #f3faf9 100%);
    }}
    .sr-head-label {{
      display: block;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: .11em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: .35rem;
    }}
    .sr-head-val {{
      display: block;
      font-size: 12.5px;
      font-weight: 500;
      color: #0f172a;
      line-height: 1.35;
      word-break: break-word;
    }}
    .sr-head-val--sprint {{
      font-size: 13.5px;
      font-weight: 700;
      color: #0d9488;
      letter-spacing: -.02em;
    }}
    .sr-body {{ padding: 0 1.35rem 1.5rem; }}
    .sr-section-block {{ margin-top: 1.35rem; }}
    .sr-section-block--spaced {{
      margin-top: 1.75rem;
      padding-top: .15rem;
    }}
    .sr-section-block--spaced + .sr-section-block--spaced {{
      margin-top: 2rem;
    }}
    .sr-section-accent {{
      height: 3px;
      width: 100%;
      background: #00b8a9;
      border-radius: 2px;
      margin-bottom: .85rem;
    }}
    .sr-section-title {{
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -.02em;
      color: #0f172a;
      margin: 0 0 1rem;
    }}
    .sr-section-block--spaced .sr-section-title {{
      margin: 0 0 1.1rem;
    }}
    .sr-evo-card {{
      border: 1px solid #e8ecef;
      border-radius: 10px;
      background: #f8fafb;
      padding: 1rem 1.1rem 1.05rem;
      margin-bottom: 0;
    }}
    .sr-evo-card__head {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .75rem;
      margin-bottom: 1rem;
    }}
    .sr-evo-card__label {{
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #1e3a5f;
      margin-bottom: .35rem;
    }}
    .sr-evo-card__hint {{
      font-size: 12px;
      line-height: 1.45;
      color: #94a3b8;
      font-weight: 400;
      max-width: 36rem;
    }}
    .sr-evo-card__pct {{
      flex-shrink: 0;
      align-self: flex-start;
      min-width: 3.5rem;
      height: 40px;
      padding: 0 .65rem;
      border: 1px solid #cce8e4;
      border-radius: 8px;
      background: #fff;
      color: #0d9488;
      font-size: 20px;
      line-height: 40px;
      text-align: center;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: -.03em;
    }}
    .sr-evo-card__track {{
      height: 10px;
      background: #e8edf2;
      border-radius: 999px;
      overflow: hidden;
    }}
    .sr-evo-card__fill {{
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #0d9488, #22c55e);
      min-width: 0;
      transition: width .2s ease;
    }}
    .sr-evo-card__scale {{
      display: flex;
      justify-content: space-between;
      margin-top: .45rem;
      font-size: 11px;
      font-weight: 500;
      color: #b0bec5;
      padding: 0 .05rem;
    }}
    .sr-table-wrap {{ overflow-x: auto; -webkit-overflow-scrolling: touch; }}
    .sr-table {{ border-collapse: collapse; margin: 0; table-layout: auto; }}
    .sr-table--items {{ width: max-content; min-width: 100%; }}
    .sr-table--etapas {{
      width: 100%;
      table-layout: fixed;
    }}
    .sr-table--etapas col.sr-table__col-date {{ width: 6.75rem; }}
    .sr-table--etapas col.sr-table__col-pct {{ width: 5rem; }}
    .sr-table th, .sr-table td {{ text-align: left; padding: .35rem .55rem; border-bottom: 1px solid #eee; vertical-align: middle; }}
    .sr-table th {{ font-size: 8px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; white-space: nowrap; }}
    .sr-table--items th.sr-table__th-compact,
    .sr-table--items td.sr-table__cell--compact {{
      width: 1%;
      white-space: nowrap;
    }}
    .sr-table--etapas th,
    .sr-table--etapas td {{
      white-space: nowrap;
    }}
    .sr-table--etapas td.sr-table__cell--stage,
    .sr-table--etapas th.sr-table__th-stage {{
      padding-right: .75rem;
    }}
    .sr-table--etapas th.sr-table__th-date,
    .sr-table--etapas td.sr-table__cell--date {{
      text-align: center;
      padding-left: .65rem;
      padding-right: .65rem;
    }}
    .sr-table--etapas th.sr-table__th-pct,
    .sr-table--etapas td.sr-table__cell--pct {{
      text-align: center;
      padding-left: .95rem;
      padding-right: .85rem;
    }}
    .sr-table th.sr-table__th-item,
    .sr-table td.sr-table__item {{
      width: auto;
      padding-right: .75rem;
    }}
    .sr-table td.sr-table__item {{
      vertical-align: middle;
    }}
    .sr-table__item-text {{
      display: inline-block;
      position: relative;
      padding-left: .7rem;
      font-size: 9.5px;
      line-height: 1.25;
      letter-spacing: -.01em;
      color: #0f172a;
      white-space: nowrap;
    }}
    .sr-table__item-text::before {{
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      width: 5px;
      height: 5px;
      margin-top: -2.5px;
      border-radius: 50%;
      background: var(--em-exec);
    }}
    .sr-table td.sr-table__cell {{ font-size: 10px; }}
    .sr-table td.sr-table__cell--date {{
      color: #0d9488;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }}
    .sr-table td.sr-table__cell--pct,
    .sr-table th.sr-table__th-pct {{ text-align: right; }}
    .sr-table__pct-val {{
      font-weight: 600;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      color: #0d9488;
    }}
    .sr-observations {{ display: grid; gap: .75rem; margin: 0; }}
    .sr-obs-card {{ border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }}
    .sr-obs-card__head {{ display: flex; align-items: center; gap: .5rem; padding: .55rem .75rem; font-weight: 700; font-size: 12px; }}
    .sr-obs-card--exec .sr-obs-card__head {{ background: #f0fdf4; color: #047857; }}
    .sr-obs-card--pa .sr-obs-card__head {{ background: #fff5f5; color: #b91c1c; }}
    .sr-obs-card--next .sr-obs-card__head {{ background: #eff6ff; color: #1d4ed8; }}
    .sr-obs-card__dot {{ width: 8px; height: 8px; border-radius: 50%; }}
    .sr-obs-card--exec .sr-obs-card__dot {{ background: var(--em-exec); }}
    .sr-obs-card--pa .sr-obs-card__dot {{ background: var(--pontos); }}
    .sr-obs-card--next .sr-obs-card__dot {{ background: var(--proximos); }}
    .sr-obs-card__body {{ padding: .65rem .85rem .75rem; }}
    .sr-obs-line {{ display: flex; gap: .5rem; margin-bottom: .45rem; align-items: stretch; }}
    .sr-obs-line__mark {{ width: 4px; border-radius: 2px; flex-shrink: 0; align-self: stretch; background: #cbd5e1; }}
    .sr-obs-line__text {{ flex: 1; min-width: 0; padding-left: .1rem; }}
    .sr-obs-line__text--rich ul, .sr-obs-line__text--rich ol {{
      margin: .35rem 0;
      padding-left: 1.4rem;
      list-style-position: outside;
    }}
    .sr-obs-line__text--rich li {{ margin-bottom: .2rem; }}
    .sr-obs-line__text--rich li p {{ margin: 0; }}
    .sr-obs-line__text--rich blockquote {{ border-left: 0; padding-left: 0; margin: 0; }}
    .sr-obs-card--exec .sr-obs-line__mark {{ background: var(--em-exec); }}
    .sr-obs-card--pa .sr-obs-line__mark {{ background: var(--pontos); }}
    .sr-obs-card--next .sr-obs-line__mark {{ background: var(--proximos); }}
    .sr-page__accent,
    .sr-page__hero,
    .sr-section-accent,
    .sr-evo-card__fill,
    .sr-obs-card__head,
    .sr-obs-card__dot,
    .sr-obs-line__mark {{
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
  @media print {{
    * {{
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }}
    body {{ background: #fff !important; }}
    .sr-topbar {{ display: none !important; }}
    .sr-page {{ box-shadow: none; border: none; margin: 0; max-width: none; }}
    .sr-page__accent {{ background: #00b8a9 !important; }}
    .sr-page__hero {{ background: #f0f9f8 !important; }}
    .sr-section-accent {{ background: #00b8a9 !important; }}
    .sr-evo-card__fill {{
      background: #0d9488 !important;
      background-image: none !important;
    }}
    .sr-evo-card__pct {{
      color: #0d9488 !important;
      border-color: #cce8e4 !important;
    }}
    .sr-head-val--sprint {{
      color: #0d9488 !important;
    }}
    .sr-head-cell--sprint {{
      background: #f3faf9 !important;
    }}
    .sr-table__item-text::before {{
      background: #00d386 !important;
    }}
    .sr-table td.sr-table__cell--date,
    .sr-table__pct-val {{
      color: #0d9488 !important;
    }}
    .sr-obs-card--exec .sr-obs-card__head {{
      background: #f0fdf4 !important;
      color: #047857 !important;
    }}
    .sr-obs-card--pa .sr-obs-card__head {{
      background: #fff5f5 !important;
      color: #b91c1c !important;
    }}
    .sr-obs-card--next .sr-obs-card__head {{
      background: #eff6ff !important;
      color: #1d4ed8 !important;
    }}
    .sr-obs-card--exec .sr-obs-card__dot,
    .sr-obs-card--exec .sr-obs-line__mark {{ background: #00d386 !important; }}
    .sr-obs-card--pa .sr-obs-card__dot,
    .sr-obs-card--pa .sr-obs-line__mark {{ background: #ff4a4a !important; }}
    .sr-obs-card--next .sr-obs-card__dot,
    .sr-obs-card--next .sr-obs-line__mark {{ background: #3b82f6 !important; }}
  }}
  </style>
</head>
<body>
  <div class="sr-topbar">{print_btn}</div>
  <article class="sr-page">
    <div class="sr-page__accent"></div>
    <header class="sr-page__hero">
      <div class="sr-page__hero-kicker">STATUS REPORT</div>
      <h1 class="sr-page__hero-title">{_esc(hero_title)}</h1>
      <div class="sr-page__hero-week">{_esc(hero_subtitle)}</div>
    </header>
    {head_grid_html}
    <div class="sr-body">
      {summary_section}
      {_render_cronograma_section(pct, report_kind=report_kind) if show_progress else ""}
      <div class="sr-section-block sr-section-block--spaced">
        <h2 class="sr-section-title">{_esc(entregas_title)}</h2>
        <div class="sr-table-wrap">
          <table class="{entregas_table_class}">{entregas_colgroup}<thead>{entregas_table_head}</thead><tbody>{entregas_table_body}</tbody></table>
        </div>
      </div>
      <div class="sr-section-block sr-section-block--spaced">
        <h2 class="sr-section-title">Observações — Semana de {_esc(_format_date_br(ctx.period_start))} a {_esc(_format_date_br(ctx.period_end))}</h2>
        <div class="sr-observations">
        <div class="sr-obs-card sr-obs-card--exec"><div class="sr-obs-card__head"><span class="sr-obs-card__dot"></span>Em execução</div><div class="sr-obs-card__body">{em_html}</div></div>
        <div class="sr-obs-card sr-obs-card--pa"><div class="sr-obs-card__head"><span class="sr-obs-card__dot"></span>Pontos de atenção</div><div class="sr-obs-card__body">{pa_html}</div></div>
        <div class="sr-obs-card sr-obs-card--next"><div class="sr-obs-card__head"><span class="sr-obs-card__dot"></span>Próximos passos</div><div class="sr-obs-card__body">{pp_html}</div></div>
        </div>
      </div>
    </div>
  </article>
</body>
</html>"""


def content_to_pdf_bytes(html_document: str) -> bytes | None:
    """Gera PDF se xhtml2pdf estiver instalado; caso contrário None."""
    try:
        from io import BytesIO

        from xhtml2pdf import pisa

        result = BytesIO()
        status = pisa.CreatePDF(html_document, dest=result, encoding="utf-8")
        if status.err:
            return None
        return result.getvalue()
    except Exception:
        return None


def apply_live_report_row_labels(report, content: dict) -> dict:
    """Atualiza consultor/responsável no content com dados vivos (perfil + projeto)."""
    sections = content.setdefault("sections", content.get("sections") or {})
    rr = sections.setdefault("report_row", sections.get("report_row") or {})
    if report.created_by_id and report.created_by is not None:
        report.created_by.refresh_from_db(fields=["display_name", "first_name", "last_name", "email"])
        rr["consultor"] = user_consultor_label(report.created_by)
    if report.project_id and report.project is not None:
        report.project.refresh_from_db(fields=["responsible_stakeholder", "name"])
        rr["responsavel_cliente"] = project_responsavel_cliente_label(report.project)
    return content


def build_export_context(report) -> StatusReportExportContext:
    project = report.project
    if report.project_id and project is not None:
        project.refresh_from_db(fields=["responsible_stakeholder", "name"])
    if report.created_by_id and report.created_by is not None:
        report.created_by.refresh_from_db(fields=["display_name", "first_name", "last_name", "email"])

    content = report.content or {}
    report_kind = content.get("report_kind")
    module_name = report.module.name if report.module_id else None
    module_start = report.module.start_date if report.module_id else None
    module_target = report.module.target_date if report.module_id else None
    if report_kind in ("sprint", "multi_module"):
        from operoz.utils.board_status_report import _report_modules_ordered

        sprint_modules = _report_modules_ordered(report)
        sprint_end = max_module_target_date(sprint_modules)
        if sprint_end is not None:
            module_target = sprint_end
    consultor = user_consultor_label(report.created_by) if report.created_by_id else "—"
    responsavel = project_responsavel_cliente_label(project) if report.project_id else "—"
    return StatusReportExportContext(
        title=report.title,
        period_start=report.period_start,
        period_end=report.period_end,
        project_name=report.project.name if report.project_id else None,
        module_name=module_name,
        board_name=report.board.name if report.board_id else None,
        content=report.content or {},
        consultor_name=consultor,
        responsavel_cliente=responsavel,
        module_start=module_start,
        module_target=module_target,
    )
