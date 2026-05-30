# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Exportação Status Report (HTML / Markdown / PDF) — layout Magalu."""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from datetime import date
from typing import Any

CONTENT_SCHEMA_VERSION = 2

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
    return {"em_execucao": [], "pontos_atencao": []}


def user_consultor_label(user) -> str:
    """Consultor = nome de exibição; fallback nome+sobrenome, depois e-mail."""
    if user is None:
        return "—"
    display = (getattr(user, "display_name", None) or "").strip()
    if display:
        return display
    first = (getattr(user, "first_name", None) or "").strip()
    last = (getattr(user, "last_name", None) or "").strip()
    combined = f"{first} {last}".strip()
    if combined:
        return combined
    full_name = getattr(user, "full_name", None) or ""
    if isinstance(full_name, str) and full_name.strip():
        return full_name.strip()
    email = getattr(user, "email", None)
    return email or "—"


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
    entregas = sections.get("entregas") or []
    if entregas:
        from plane.utils.board_status_report import progress_pct_from_entregas

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


def _report_row(ctx: StatusReportExportContext) -> dict:
    sections = _sections(ctx)
    rr = sections.get("report_row") or {}
    return {
        "produto": rr.get("produto") or ctx.module_name or "—",
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


def content_to_markdown(ctx: StatusReportExportContext) -> str:
    sections = _sections(ctx)
    rr = _report_row(ctx)
    obs = _observacoes(ctx)
    progress = sections.get("progress") or {}
    pct = progress.get("pct", 0)

    lines = [
        f"# {ctx.title}",
        "",
        f"**Projeto:** {ctx.project_name or '—'}",
        f"**Módulo:** {rr['produto']}",
        f"**Consultor:** {rr['consultor']}",
        f"**Responsável cliente:** {rr['responsavel_cliente']}",
        f"**Início:** {rr['inicio']} · **Fim:** {rr['fim']}",
        f"**Report semanal:** {_format_date_br(ctx.period_start)} a {_format_date_br(ctx.period_end)}",
        "",
    ]

    summary = (sections.get("executive_summary") or {}).get("html") or ""
    if summary.strip():
        lines.extend(["## Resumo executivo", "", summary.strip(), ""])

    if not progress.get("omitir_global", False):
        lines.extend(["## Cronograma", "", f"**Evolução do projeto:** {pct}%", ""])

    entregas = sections.get("entregas") or []
    if entregas:
        lines.extend(["## Entregas do projeto", "", "| Etapa | Início | Entrega | Avanço |", "| --- | --- | --- | --- |"])
        for row in entregas:
            pct_txt = "—" if row.get("mostrar_pct") is False else f"{row.get('pct', 0)}%"
            lines.append(
                f"| {row.get('etapa', '')} | {row.get('data_inicio', '—')} | {row.get('data_entrega', '—')} | {pct_txt} |"
            )
        lines.append("")

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

    return "\n".join(lines).strip() + "\n"


def _cronograma_hint(pct: int) -> str:
    if pct <= 0:
        return "Percentual médio do cronograma será definido após o encerramento da imersão."
    return f"Média do avanço das etapas do cronograma: {pct}%."


def _render_cronograma_section(pct: int) -> str:
    hint = _esc(_cronograma_hint(pct))
    return f"""
      <div class="sr-section-block">
        <div class="sr-section-accent" aria-hidden="true"></div>
        <h2 class="sr-section-title">Cronograma</h2>
      <section class="sr-evo-card" data-sr-template="cronograma-v2" aria-label="Evolução do projeto">
        <div class="sr-evo-card__head">
          <div class="sr-evo-card__copy">
            <div class="sr-evo-card__label">Evolução do projeto</div>
            <p class="sr-evo-card__hint">{hint}</p>
          </div>
          <div class="sr-evo-card__toggle" aria-hidden="true">−</div>
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

    entregas_html = ""
    for row in sections.get("entregas") or []:
        pct_txt = "—" if row.get("mostrar_pct") is False else f"{_esc(row.get('pct', '0'))}%"
        entregas_html += (
            f"<tr><td>{_esc(row.get('etapa', ''))}</td>"
            f"<td>{_esc(row.get('data_inicio', '—'))}</td>"
            f"<td>{_esc(row.get('data_entrega', '—'))}</td>"
            f"<td>{pct_txt}</td></tr>"
        )

    week_line = f"Report semanal · {_format_date_br(ctx.period_start)} a {_format_date_br(ctx.period_end)}"
    em_html = _render_obs_list(obs["em_execucao"], "exec")
    pa_html = _render_obs_list(obs["pontos_atencao"], "pa")

    print_btn = ""
    if not for_pdf:
        print_btn = '<button type="button" class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>'

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{_esc(ctx.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root {{ --em-exec: #00d386; --pontos: #ff4a4a; --ink: #0f172a; --muted: #64748b; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: Inter, sans-serif; background: #eceff1; color: var(--ink); font-size: 12.5px; line-height: 1.35; }}
    .sr-topbar {{ max-width: 52rem; margin: 0.75rem auto; display: flex; gap: 0.5rem; }}
    .btn-print {{ background: #37474f; color: #fff; border: none; padding: 0.45rem 0.85rem; border-radius: 4px; font-weight: 600; cursor: pointer; }}
    .sr-page {{ max-width: 52rem; margin: 0 auto 2rem; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,.08); border: 1px solid #e8ecef; }}
    .sr-page__accent {{ height: 5px; background: #00b8a9; }}
    .sr-page__hero {{ padding: 1.25rem 1.35rem; background: #f0f9f8; border-bottom: 1px solid rgba(0,184,169,.12); }}
    .sr-page__hero-kicker {{ font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #9e9e9e; margin-bottom: .4rem; }}
    .sr-page__hero-title {{ font-size: 1.35rem; font-weight: 700; }}
    .sr-page__hero-week {{ margin-top: .45rem; font-size: 11px; color: var(--muted); font-weight: 600; }}
    .sr-head-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; padding: 1.1rem 1.35rem .5rem; text-align: center; }}
    .sr-head-label {{ display: block; font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #9e9e9e; margin-bottom: .25rem; }}
    .sr-head-val {{ font-size: 13px; font-weight: 500; }}
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
    .sr-evo-card__toggle {{
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      color: #64748b;
      font-size: 18px;
      line-height: 1;
      display: grid;
      place-items: center;
      font-weight: 300;
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
    .sr-table {{ width: 100%; border-collapse: collapse; margin: 0; }}
    .sr-table th, .sr-table td {{ text-align: left; padding: .4rem .5rem; border-bottom: 1px solid #eee; }}
    .sr-table th {{ font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; }}
    .sr-observations {{ display: grid; gap: .75rem; margin: 0; }}
    .sr-obs-card {{ border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }}
    .sr-obs-card__head {{ display: flex; align-items: center; gap: .5rem; padding: .55rem .75rem; font-weight: 700; font-size: 12px; }}
    .sr-obs-card--exec .sr-obs-card__head {{ background: #f0fdf4; color: #047857; }}
    .sr-obs-card--pa .sr-obs-card__head {{ background: #fff5f5; color: #b91c1c; }}
    .sr-obs-card__dot {{ width: 8px; height: 8px; border-radius: 50%; }}
    .sr-obs-card--exec .sr-obs-card__dot {{ background: var(--em-exec); }}
    .sr-obs-card--pa .sr-obs-card__dot {{ background: var(--pontos); }}
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
    .sr-obs-card--exec .sr-obs-card__head {{
      background: #f0fdf4 !important;
      color: #047857 !important;
    }}
    .sr-obs-card--pa .sr-obs-card__head {{
      background: #fff5f5 !important;
      color: #b91c1c !important;
    }}
    .sr-obs-card--exec .sr-obs-card__dot,
    .sr-obs-card--exec .sr-obs-line__mark {{ background: #00d386 !important; }}
    .sr-obs-card--pa .sr-obs-card__dot,
    .sr-obs-card--pa .sr-obs-line__mark {{ background: #ff4a4a !important; }}
  }}
  </style>
</head>
<body>
  <div class="sr-topbar">{print_btn}</div>
  <article class="sr-page">
    <div class="sr-page__accent"></div>
    <header class="sr-page__hero">
      <div class="sr-page__hero-kicker">STATUS REPORT</div>
      <h1 class="sr-page__hero-title">{_esc(rr['produto'])}</h1>
      <div class="sr-page__hero-week">{_esc(week_line)}</div>
    </header>
    <div class="sr-head-grid">
      <div><span class="sr-head-label">Consultor</span><span class="sr-head-val">{_esc(rr['consultor'])}</span></div>
      <div><span class="sr-head-label">Responsável cliente</span><span class="sr-head-val">{_esc(rr['responsavel_cliente'])}</span></div>
      <div><span class="sr-head-label">Início</span><span class="sr-head-val">{_esc(rr['inicio'])}</span></div>
      <div><span class="sr-head-label">Fim</span><span class="sr-head-val">{_esc(rr['fim'])}</span></div>
    </div>
    <div class="sr-body">
      {_render_cronograma_section(pct) if show_progress else ""}
      <div class="sr-section-block sr-section-block--spaced">
        <h2 class="sr-section-title">Entregas do projeto</h2>
        <table class="sr-table"><thead><tr><th>Etapa</th><th>Início</th><th>Entrega</th><th>Avanço</th></tr></thead><tbody>{entregas_html}</tbody></table>
      </div>
      <div class="sr-section-block sr-section-block--spaced">
        <h2 class="sr-section-title">Observações — Semana de {_esc(_format_date_br(ctx.period_start))} a {_esc(_format_date_br(ctx.period_end))}</h2>
        <div class="sr-observations">
        <div class="sr-obs-card sr-obs-card--exec"><div class="sr-obs-card__head"><span class="sr-obs-card__dot"></span>Em execução</div><div class="sr-obs-card__body">{em_html}</div></div>
        <div class="sr-obs-card sr-obs-card--pa"><div class="sr-obs-card__head"><span class="sr-obs-card__dot"></span>Pontos de atenção</div><div class="sr-obs-card__body">{pa_html}</div></div>
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

    module_name = report.module.name if report.module_id else None
    module_start = report.module.start_date if report.module_id else None
    module_target = report.module.target_date if report.module_id else None
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
