from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from operoz.discord_integration.services.text_utils import (
    DISCORD_EMBED_DESCRIPTION_MAX_LENGTH,
    truncate_for_discord,
)

OPEROZ_EMBED_COLOR = 0x4569B3
OPEROZ_EMBED_COLOR_SUCCESS = 0x2D8A5E
OPEROZ_EMBED_COLOR_WARNING = 0xC47F17
OPEROZ_EMBED_COLOR_DANGER = 0xC93C37

DISCORD_FOOTER_TEXT = "Operoz OS"

COL_CLIENT = 12
COL_CONCL = 5
COL_OPEN = 5
COL_CLOSED = 5
COL_SUST = 3
COL_REPORT = 5
ROW_PREFIX_WIDTH = 4


@dataclass(frozen=True)
class DiscordFollowupPayload:
    content: str = ""
    embeds: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class DiscordReply:
    payloads: list[DiscordFollowupPayload]

    @classmethod
    def text(cls, content: str) -> DiscordReply:
        return cls([DiscordFollowupPayload(content=truncate_for_discord(content))])

    @classmethod
    def embeds(cls, embeds: list[dict[str, Any]], *, content: str = "") -> DiscordReply:
        return cls([DiscordFollowupPayload(content=content, embeds=embeds)])


def _completion_percent(project: dict[str, object]) -> int:
    total = int(project.get("total_issues") or 0)
    completed = int(project.get("completed_issues") or 0)
    if total <= 0:
        return 0
    return round(100 * completed / total)


def _status_indicator(percent: int) -> str:
    if percent >= 75:
        return "🟢"
    if percent >= 35:
        return "🟡"
    return "🔴"


def _embed_color_for_percent(percent: int) -> int:
    if percent >= 75:
        return OPEROZ_EMBED_COLOR_SUCCESS
    if percent >= 35:
        return OPEROZ_EMBED_COLOR_WARNING
    return OPEROZ_EMBED_COLOR_DANGER


def _format_int(value: int) -> str:
    return f"{value:,}".replace(",", ".")


def _embed_footer(*, extra: str = "") -> dict[str, str]:
    text = DISCORD_FOOTER_TEXT if not extra else f"{DISCORD_FOOTER_TEXT} · {extra}"
    return {"text": text}


def _embed_author(*, subtitle: str = "Relatório de status") -> dict[str, str]:
    return {"name": f"Operoz OS · {subtitle}"}


def _base_embed(
    *,
    title: str,
    description: str = "",
    color: int = OPEROZ_EMBED_COLOR,
    footer_extra: str = "",
) -> dict[str, Any]:
    embed: dict[str, Any] = {
        "author": _embed_author(),
        "title": title[:256],
        "color": color,
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "footer": _embed_footer(extra=footer_extra),
    }
    if description:
        embed["description"] = truncate_for_discord(description, max_length=DISCORD_EMBED_DESCRIPTION_MAX_LENGTH)
    return embed


def _align_cell(text: str, width: int, *, align: str = "left") -> str:
    clipped = text[:width]
    if align == "center":
        return clipped.center(width)
    if align == "right":
        return clipped.rjust(width)
    return clipped.ljust(width)


def _field(name: str, value: str, *, inline: bool = True) -> dict[str, Any]:
    return {"name": name[:256], "value": value[:1024], "inline": inline}


def _format_report_status(coverage: object, *, short: bool = False) -> str:
    if short:
        labels = {"complete": "Sim", "partial": "Parc", "missing": "Não", "n_a": "N/A"}
    else:
        labels = {"complete": "Sim", "partial": "Parcial", "missing": "Não", "n_a": "N/A"}
    return labels.get(str(coverage or "missing"), "—")


def _project_display_name(project: dict[str, object]) -> str:
    return str(project.get("name") or project.get("identifier") or "Projeto")


def _table_divider(header_line: str) -> str:
    return f" {'─' * max(20, len(header_line) - 1)}"


def _build_project_table_header() -> str:
    return (
        f"{' ' * ROW_PREFIX_WIDTH}"
        f"{_align_cell('Cliente', COL_CLIENT)} "
        f"{_align_cell('Concl', COL_CONCL, align='center')} "
        f"{_align_cell('Abert', COL_OPEN, align='center')} "
        f"{_align_cell('Fech', COL_CLOSED, align='center')} "
        f"{_align_cell('Sust', COL_SUST, align='center')} "
        f"{_align_cell('Rep.', COL_REPORT, align='center')}"
    )


def _format_project_table_row(project: dict[str, object]) -> str:
    pct = _completion_percent(project)
    open_issues = int(project.get("open_issues") or 0)
    completed = int(project.get("completed_issues") or 0)
    support_open = int(project.get("support_open") or 0)
    report_label = _format_report_status(project.get("status_report_coverage"), short=True)
    indicator = _status_indicator(pct)
    return (
        f" {indicator} "
        f"{_align_cell(_project_display_name(project), COL_CLIENT)} "
        f"{_align_cell(f'{pct}%', COL_CONCL, align='center')} "
        f"{_align_cell(_format_int(open_issues), COL_OPEN, align='center')} "
        f"{_align_cell(_format_int(completed), COL_CLOSED, align='center')} "
        f"{_align_cell(_format_int(support_open), COL_SUST, align='center')} "
        f"{_align_cell(report_label, COL_REPORT, align='center')}"
    )


def _build_project_table(projects: list[dict[str, object]]) -> str:
    header = _build_project_table_header()
    rows = [_format_project_table_row(project) for project in projects]
    body = "\n".join([header, _table_divider(header), *rows])
    return f"```\n{body}\n```"


def _build_overview_summary_block(
    *,
    project_count: int,
    aggregate_pct: int,
    total_open: int,
    total_completed: int,
    total_support: int,
    reports_ok: int,
) -> str:
    label_width = 14
    rows = [
        "Resumo da squad",
        "─" * 36,
        f"{'Projetos'.ljust(label_width)}{_format_int(project_count)}",
        f"{'Concluído'.ljust(label_width)}{aggregate_pct}% {_status_indicator(aggregate_pct)}",
        (
            f"{'Issues'.ljust(label_width)}"
            f"{_format_int(total_open)} abertas · {_format_int(total_completed)} fechadas"
        ),
        f"{'Sustentação'.ljust(label_width)}{_format_int(total_support)} abertos",
        f"{'Status report'.ljust(label_width)}{_format_int(reports_ok)}/{_format_int(project_count)} publicados",
    ]
    return f"```\n{chr(10).join(rows)}\n```"


def filter_stats_by_focus(stats: list[dict[str, object]], focus: str) -> list[dict[str, object]]:
    needle = focus.strip().casefold()
    if not needle:
        return stats

    exact = [
        project
        for project in stats
        if needle == str(project.get("name", "")).casefold()
        or needle == str(project.get("identifier", "")).casefold()
    ]
    if exact:
        return exact

    partial = [
        project
        for project in stats
        if needle in str(project.get("name", "")).casefold()
        or needle in str(project.get("identifier", "")).casefold()
    ]
    return partial


def build_overview_reply(stats: list[dict[str, object]]) -> DiscordReply:
    if not stats:
        embed = _base_embed(
            title="Panorama da squad",
            description="Nenhum projeto encontrado para este workspace ou escopo.",
        )
        return DiscordReply([DiscordFollowupPayload(embeds=[embed])])

    total_issues = sum(int(project.get("total_issues") or 0) for project in stats)
    total_open = sum(int(project.get("open_issues") or 0) for project in stats)
    total_completed = sum(int(project.get("completed_issues") or 0) for project in stats)
    total_support = sum(int(project.get("support_open") or 0) for project in stats)
    reports_ok = sum(1 for project in stats if project.get("status_report_coverage") == "complete")
    aggregate_pct = round(100 * total_completed / total_issues) if total_issues else 0

    sorted_stats = sorted(
        stats,
        key=lambda project: (-int(project.get("open_issues") or 0), _project_display_name(project).casefold()),
    )

    description = "\n\n".join(
        [
            "**Clientes** · ordenados por issues abertas (maior → menor)",
            _build_project_table(sorted_stats),
            _build_overview_summary_block(
                project_count=len(stats),
                aggregate_pct=aggregate_pct,
                total_open=total_open,
                total_completed=total_completed,
                total_support=total_support,
                reports_ok=reports_ok,
            ),
        ]
    )
    embed = _base_embed(
        title="Panorama da squad",
        description=description,
        color=_embed_color_for_percent(aggregate_pct),
    )
    return DiscordReply([DiscordFollowupPayload(embeds=[embed])])


def build_focus_reply(*, focus: str, llm_text: str, stats: list[dict[str, object]]) -> DiscordReply:
    matched = filter_stats_by_focus(stats, focus)
    title_focus = focus.strip() or "Projeto"
    if len(matched) == 1:
        project = matched[0]
        name = _project_display_name(project)
        pct = _completion_percent(project)
        open_issues = int(project.get("open_issues") or 0)
        completed = int(project.get("completed_issues") or 0)
        total = int(project.get("total_issues") or 0)
        support_open = int(project.get("support_open") or 0)
        report_label = _format_report_status(project.get("status_report_coverage"))
        embed = _base_embed(
            title=name,
            description=llm_text.strip() or "Sem observações adicionais para este cliente.",
            color=_embed_color_for_percent(pct),
        )
        embed["author"] = _embed_author(subtitle="Detalhe do cliente")
        embed["fields"] = [
            _field("Concluído", f"**{pct}%** {_status_indicator(pct)}"),
            _field("Abertas", f"**{_format_int(open_issues)}**"),
            _field("Fechadas", f"**{_format_int(completed)}**"),
            _field("Total", f"**{_format_int(total)}**"),
            _field("Sustentação", f"**{_format_int(support_open)}** abertos"),
            _field("Status report", f"**{report_label}**"),
        ]
    else:
        embed = _base_embed(
            title=f"Status · {title_focus}",
            description=llm_text.strip() or "Sem detalhes adicionais para este foco.",
        )
        embed["author"] = _embed_author(subtitle="Detalhe do cliente")

    return DiscordReply.embeds([embed])


def build_branded_embed(
    *,
    subtitle: str = "Notificação",
    title: str,
    description: str = "",
    color: int = OPEROZ_EMBED_COLOR,
    fields: list[dict[str, Any]] | None = None,
    url: str = "",
    footer_extra: str = "",
) -> dict[str, Any]:
    embed = _base_embed(
        title=title,
        description=description,
        color=color,
        footer_extra=footer_extra,
    )
    embed["author"] = _embed_author(subtitle=subtitle)
    if url:
        embed["url"] = url[:512]
    if fields:
        embed["fields"] = fields
    return embed


def build_text_embed(*, title: str, description: str) -> DiscordReply:
    embed = _base_embed(title=title, description=description)
    return DiscordReply.embeds([embed])


def build_error_reply(message: str) -> DiscordReply:
    embed = _base_embed(
        title="Não foi possível concluir",
        description=message,
        color=OPEROZ_EMBED_COLOR_DANGER,
    )
    embed["author"] = _embed_author(subtitle="Integração Discord")
    return DiscordReply.embeds([embed])
