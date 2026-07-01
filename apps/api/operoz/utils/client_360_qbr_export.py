from __future__ import annotations

import html
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Literal

from operoz.utils.client_360 import ReportCoverage, WeekPeriod
from operoz.utils.status_report_export import content_to_pdf_bytes

QBR_EXPORT_SCHEMA_VERSION = 1
QBR_DEFAULT_WEEKS = 13
QBR_MAX_WEEKS = 13
QBR_MAX_PDF_BYTES = 5 * 1024 * 1024

QbrScope = Literal["portfolio", "client"]

COVERAGE_LABELS: dict[ReportCoverage, str] = {
    "complete": "Completo",
    "partial": "Parcial",
    "missing": "Em falta",
    "n_a": "N/A",
}

HEALTH_LABELS = {
    "ok": "OK",
    "warning": "Atenção",
    "critical": "Crítico",
}


def parse_qbr_weeks(raw: str | None) -> tuple[int, str | None]:
    if raw is None or raw == "":
        return QBR_DEFAULT_WEEKS, None
    try:
        weeks = int(raw)
    except (TypeError, ValueError):
        return QBR_DEFAULT_WEEKS, "weeks must be an integer"
    if weeks < 1 or weeks > QBR_MAX_WEEKS:
        return QBR_DEFAULT_WEEKS, f"weeks must be between 1 and {QBR_MAX_WEEKS}"
    return weeks, None


def parse_qbr_format(raw: str | None) -> tuple[str, str | None]:
    fmt = (raw or "md").lower().strip()
    if fmt not in {"md", "pdf"}:
        return "md", "export_format must be md or pdf"
    return fmt, None


def _esc(value: Any) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def _format_date_br(value: str | date) -> str:
    if isinstance(value, date):
        d = value
    else:
        d = date.fromisoformat(str(value)[:10])
    return d.strftime("%d/%m/%Y")


def _coverage_label(coverage: str) -> str:
    return COVERAGE_LABELS.get(coverage, coverage)  # type: ignore[arg-type]


def _health_label(health: str) -> str:
    return HEALTH_LABELS.get(health, health)


def _sparkline_ascii(scores: list[int | None]) -> str:
    if not scores:
        return "—"
    chars = "▁▂▃▄▅▆▇█"
    valid = [score for score in scores if score is not None]
    if not valid:
        return "—"
    min_s, max_s = min(valid), max(valid)
    span = max(max_s - min_s, 1)
    out = []
    for score in scores:
        if score is None:
            out.append("·")
            continue
        idx = round((score - min_s) / span * (len(chars) - 1))
        out.append(chars[max(0, min(len(chars) - 1, idx))])
    return "".join(out)


@dataclass(frozen=True)
class QbrBuildInput:
    scope: QbrScope
    workspace_name: str
    period: WeekPeriod
    weeks_requested: int
    summary: dict
    period_compare: dict | None
    clients: list[dict]
    chart_warnings: list[str]
    client_detail: dict | None = None
    health_history: list[dict] | None = None
    matrix_weeks: list[dict] | None = None
    matrix_cells: list[dict] | None = None
    narrative: dict | None = None


def build_qbr_wins_risks(clients: list[dict]) -> tuple[list[str], list[str]]:
    wins: list[str] = []
    risks: list[str] = []

    for client in clients:
        name = client.get("name") or client.get("identifier") or "Cliente"
        coverage = client.get("status_report", {}).get("coverage")
        health = client.get("health")
        overdue = client.get("issues", {}).get("overdue", 0)
        compare = client.get("period_compare") or {}

        if coverage == "complete":
            wins.append(f"{name}: status report completo na semana de referência.")
        if compare.get("available") and (compare.get("health_score_delta") or 0) > 5:
            wins.append(f"{name}: score de saúde melhorou {compare['health_score_delta']} pts vs semana anterior.")
        if compare.get("available") and (compare.get("overdue_delta") or 0) < 0:
            wins.append(f"{name}: atrasos reduziram {abs(compare['overdue_delta'])} vs semana anterior.")

        if coverage == "missing":
            risks.append(f"{name}: status report em falta na semana de referência.")
        if health == "critical":
            risks.append(f"{name}: saúde crítica (score {client.get('health_score', '—')}).")
        if overdue >= 3:
            risks.append(f"{name}: {overdue} cards atrasados.")
        if client.get("support", {}).get("overdue_count", 0) > 0:
            risks.append(f"{name}: sustentação atrasada aberta.")

    return wins[:12], risks[:12]


def build_qbr_matrix_summary(
    weeks: list[dict],
    cells: list[dict],
) -> list[dict]:
    if not weeks or not cells:
        return []
    rows = []
    for week in weeks:
        start = week["period_start"]
        counts = {"complete": 0, "partial": 0, "missing": 0, "n_a": 0}
        for cell in cells:
            if cell.get("period_start") != start:
                continue
            coverage = cell.get("coverage", "n_a")
            counts[coverage] = counts.get(coverage, 0) + 1
        rows.append({"period_start": start, "period_end": week["period_end"], "counts": counts})
    return rows


def build_qbr_payload(data: QbrBuildInput) -> dict:
    wins, risks = build_qbr_wins_risks(data.clients)
    matrix_summary = build_qbr_matrix_summary(data.matrix_weeks or [], data.matrix_cells or [])

    health_scores = []
    if data.health_history:
        health_scores = [row.get("health_score") for row in data.health_history]
    elif data.scope == "client" and data.client_detail:
        health_scores = [data.client_detail.get("health_score")]

    chart_warnings = list(data.chart_warnings)
    sparkline = _sparkline_ascii(health_scores)
    if data.weeks_requested > 1 and sparkline == "—" and data.scope == "client":
        chart_warnings.append(
            "Gráfico de tendência indisponível — histórico parcial omitido do pacote QBR."
        )

    title = (
        f"QBR — {data.client_detail['name']}"
        if data.scope == "client" and data.client_detail
        else f"QBR Carteira — {data.workspace_name}"
    )

    return {
        "schema_version": QBR_EXPORT_SCHEMA_VERSION,
        "scope": data.scope,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "title": title,
        "workspace_name": data.workspace_name,
        "period_start": data.period.start.isoformat(),
        "period_end": data.period.end.isoformat(),
        "weeks_requested": data.weeks_requested,
        "summary": data.summary,
        "period_compare": data.period_compare,
        "chart_warnings": chart_warnings,
        "health_sparkline": sparkline,
        "health_history": data.health_history or [],
        "matrix_summary": matrix_summary,
        "wins": wins,
        "risks": risks,
        "clients": data.clients if data.scope == "portfolio" else [],
        "client_detail": data.client_detail,
        "narrative": data.narrative,
    }


def qbr_to_markdown(payload: dict) -> str:
    lines = [
        f"# {payload['title']}",
        "",
        f"**Operoz Visão 360** · **Workspace:** {payload['workspace_name']}",
        f"**Período de referência:** {_format_date_br(payload['period_start'])} — {_format_date_br(payload['period_end'])}",
        f"**Janela QBR:** {payload['weeks_requested']} semanas",
        f"**Gerado em:** {payload['generated_at'][:19].replace('T', ' ')} UTC",
        "",
        "---",
        "",
        "## Resumo executivo",
        "",
        f"- Clientes na carteira: **{payload['summary'].get('total_clients', 0)}**",
        f"- Saúde crítica: **{payload['summary'].get('health_critical', 0)}**",
        f"- Sem report: **{payload['summary'].get('report_missing', 0)}**",
        f"- Cards atrasados (total): **{payload['summary'].get('total_overdue', 0)}**",
        f"- Sustentação aberta: **{payload['summary'].get('total_support_open', 0)}**",
        "",
    ]

    compare = payload.get("period_compare") or {}
    summary_delta = compare.get("summary_delta") if compare.get("available") else None
    if summary_delta:
        lines.extend(
            [
                "### Delta vs semana anterior",
                "",
                f"- Δ atrasados: **{summary_delta.get('total_overdue', 0)}**",
                f"- Δ sem report: **{summary_delta.get('report_missing', 0)}**",
                f"- Δ sustentação: **{summary_delta.get('total_support_open', 0)}**",
                "",
            ]
        )

    detail = payload.get("client_detail")
    if detail:
        lines.extend(
            [
                "## Cliente",
                "",
                f"- **Nome:** {detail.get('name', '—')}",
                f"- **Identificador:** {detail.get('identifier', '—')}",
                f"- **Score de saúde:** {detail.get('health_score', '—')} ({_health_label(detail.get('health', 'ok'))})",
                f"- **Status report:** {_coverage_label(detail.get('status_report', {}).get('coverage', 'n_a'))}",
                f"- **Atrasados:** {detail.get('issues', {}).get('overdue', 0)}",
                f"- **Sustentação aberta:** {detail.get('support', {}).get('open_count', 0)}",
                "",
            ]
        )

        modules = detail.get("modules") or []
        if modules:
            lines.extend(["### Status report por módulo", "", "| Módulo | Estado |", "| --- | --- |"])
            for module in modules:
                status = module.get("status", "missing")
                label = {"published": "Publicado", "draft": "Rascunho", "missing": "Em falta"}.get(
                    status, status
                )
                lines.append(f"| {module.get('module_name') or '—'} | {label} |")
            lines.append("")

        overdue = detail.get("overdue_issues") or []
        if overdue:
            lines.extend(["### Cards atrasados", ""])
            for issue in overdue[:10]:
                lines.append(f"- {issue.get('name', '—')} (#{issue.get('sequence_id', '—')})")
            lines.append("")

        support = detail.get("support_issues") or []
        if support:
            lines.extend(["### Sustentação", ""])
            for issue in support[:10]:
                lines.append(f"- {issue.get('name', '—')} (#{issue.get('sequence_id', '—')})")
            lines.append("")

    history = payload.get("health_history") or []
    if history:
        lines.extend(["## Tendência de saúde", "", f"```{payload.get('health_sparkline', '—')}```", ""])
        lines.extend(["| Semana | Score | Saúde |", "| --- | ---: | --- |"])
        for row in history:
            lines.append(
                f"| {_format_date_br(row['period_start'])} | {row.get('health_score', '—')} | {_health_label(row.get('health', 'ok'))} |"
            )
        lines.append("")

    matrix = payload.get("matrix_summary") or []
    if matrix:
        lines.extend(
            [
                "## Matriz resumo (status report)",
                "",
                "| Semana | Completo | Parcial | Em falta | N/A |",
                "| --- | ---: | ---: | ---: | ---: |",
            ]
        )
        for row in matrix:
            counts = row.get("counts") or {}
            lines.append(
                f"| {_format_date_br(row['period_start'])} | {counts.get('complete', 0)} | {counts.get('partial', 0)} | {counts.get('missing', 0)} | {counts.get('n_a', 0)} |"
            )
        lines.append("")

    if payload.get("scope") == "portfolio" and payload.get("clients"):
        lines.extend(["## Carteira (semana de referência)", "", "| Cliente | Saúde | Score | Report | Atrasados |", "| --- | --- | ---: | --- | ---: |"])
        for client in payload["clients"][:50]:
            lines.append(
                f"| {client.get('name', '—')} | {_health_label(client.get('health', 'ok'))} | {client.get('health_score', '—')} | {_coverage_label(client.get('status_report', {}).get('coverage', 'n_a'))} | {client.get('issues', {}).get('overdue', 0)} |"
            )
        lines.append("")

    wins = payload.get("wins") or []
    risks = payload.get("risks") or []
    narrative = payload.get("narrative") or {}
    if narrative.get("wins_md"):
        lines.extend(["## Wins (narrativa)", "", narrative["wins_md"], ""])
    if narrative.get("risks_md"):
        lines.extend(["## Riscos (narrativa)", "", narrative["risks_md"], ""])
    if narrative.get("next_steps_md"):
        lines.extend(["## Próximos passos", "", narrative["next_steps_md"], ""])
    lines.extend(["## Wins", ""])
    lines.extend([f"- {item}" for item in wins] if wins else ["- Nenhum destaque automático identificado."])
    lines.extend(["", "## Riscos", ""])
    lines.extend([f"- {item}" for item in risks] if risks else ["- Nenhum risco automático identificado."])
    lines.append("")

    warnings = payload.get("chart_warnings") or []
    if warnings:
        lines.extend(["## Avisos", ""])
        lines.extend([f"- {warning}" for warning in warnings])
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("*Documento gerado automaticamente pela Operoz Visão 360.*")
    lines.append("")
    return "\n".join(lines)


def qbr_to_html(payload: dict) -> str:
    md = qbr_to_markdown(payload)
    body = "<br/>\n".join(_esc(line) if line else "" for line in md.splitlines())
    warnings = payload.get("chart_warnings") or []
    warning_html = ""
    if warnings:
        items = "".join(f"<li>{_esc(w)}</li>" for w in warnings)
        warning_html = f'<div class="qbr-warn"><strong>Avisos</strong><ul>{items}</ul></div>'

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>{_esc(payload.get('title', 'QBR'))}</title>
  <style>
    body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11pt; color: #111; margin: 24px; }}
    h1 {{ font-size: 20pt; margin-bottom: 4px; }}
    h2 {{ font-size: 14pt; margin-top: 18px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }}
    h3 {{ font-size: 12pt; margin-top: 14px; }}
    .qbr-warn {{ background: #fff8e6; border: 1px solid #f0d060; padding: 10px 12px; margin: 12px 0; }}
    pre {{ font-family: monospace; background: #f5f5f5; padding: 8px; }}
  </style>
</head>
<body>
  {warning_html}
  <pre style="white-space: pre-wrap; font-family: Helvetica, Arial, sans-serif; background: transparent; padding: 0;">{_esc(md)}</pre>
</body>
</html>"""


def qbr_to_pdf_bytes(payload: dict) -> tuple[bytes | None, list[str]]:
    warnings = list(payload.get("chart_warnings") or [])
    html_doc = qbr_to_html(payload)
    pdf = content_to_pdf_bytes(html_doc)
    if pdf is None:
        warnings.append("PDF indisponível — servidor sem renderizador; use Markdown ou impressão HTML.")
        return None, warnings
    if len(pdf) > QBR_MAX_PDF_BYTES:
        warnings.append("PDF excede 5MB — export parcial recomendado em Markdown.")
        return None, warnings
    return pdf, warnings
