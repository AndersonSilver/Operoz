from __future__ import annotations

import hashlib
import json
from datetime import date, timedelta
from typing import Any

from django.utils import timezone

from operis.db.models import (
    Client360HealthSnapshot,
    Client360QbrDraft,
    Client360SuggestedActionDismissal,
    WorkspaceClient360ScenarioPlaybook,
    WorkspaceClient360WeeklyBriefing,
)

PROMPT_VERSION = "v1"
MAX_SUGGESTED_ACTIONS = 5
RAG_SNAPSHOT_RETENTION_WEEKS = 52

DEFAULT_SCENARIO_PLAYBOOKS: list[dict[str, str]] = [
    {
        "scenario_key": "report_missing",
        "playbook_code": "SR-001",
        "title": "Status report em falta",
        "markdown": """## Objetivo
Garantir publicação do status report semanal do cliente.

## Passos
1. Confirmar módulos sem report na semana corrente.
2. Contactar PM responsável e alinhar prazo de publicação.
3. Publicar report no Operoz (rascunho → revisão → publicado).
4. Registar bloqueios ou dependências no RAID se aplicável.

## Critério de fecho
Report publicado para todos os módulos activos ou excepção documentada.""",
    },
    {
        "scenario_key": "sla_breach",
        "playbook_code": "SLA-001",
        "title": "SLA de sustentação violado",
        "markdown": """## Objetivo
Recuperar cumprimento de SLA em chamados de sustentação.

## Passos
1. Listar chamados abertos acima do SLA configurado.
2. Priorizar por impacto e idade.
3. Escalar para squad lead se capacidade insuficiente.
4. Comunicar cliente sobre plano de recuperação.

## Critério de fecho
Zero chamados acima do SLA ou plano acordado com data.""",
    },
    {
        "scenario_key": "health_critical",
        "playbook_code": "HC-001",
        "title": "Saúde crítica do cliente",
        "markdown": """## Objetivo
Estabilizar score de saúde abaixo do limiar crítico.

## Passos
1. Revisar breakdown: report, atrasos, sustentação.
2. Agendar war room com PM e responsável Operis.
3. Definir 3 acções corretivas com owner e data.
4. Acompanhar diariamente até sair de crítico.

## Critério de fecho
Score acima do limiar de alerta por 2 semanas consecutivas.""",
    },
    {
        "scenario_key": "finops_variance",
        "playbook_code": "FN-001",
        "title": "Desvio orçamentário FinOps",
        "markdown": """## Objetivo
Controlar variância orçamento vs planeado.

## Passos
1. Validar horas alocadas vs capacidade squad.
2. Revisar custo Harness MTD e burn rate.
3. Alinhar com controller ajuste de forecast.
4. Documentar causa raiz (scope creep, subestimativa, etc.).

## Critério de fecho
Variância dentro do limiar configurado ou plano de mitigação aprovado.""",
    },
]


def compute_facts_hash(payload: dict) -> str:
    normalized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def quarter_key_from_date(d: date) -> str:
    quarter = (d.month - 1) // 3 + 1
    return f"{d.year}-Q{quarter}"


def build_weekly_briefing_facts(*, summary: dict, clients: list[dict], period: dict) -> dict:
    critical = [c for c in clients if c.get("health") == "critical"]
    warning = [c for c in clients if c.get("health") == "warning"]
    missing_report = [
        c
        for c in clients
        if (c.get("status_report") or {}).get("coverage") in ("missing", "partial")
    ]
    return {
        "period": period,
        "summary": summary,
        "totals": {
            "clients": len(clients),
            "critical": len(critical),
            "warning": len(warning),
            "missing_report": len(missing_report),
        },
        "top_critical": [
            {
                "project_id": c["project_id"],
                "name": c["name"],
                "health_score": c.get("health_score"),
                "overdue": (c.get("issues") or {}).get("overdue", 0),
            }
            for c in sorted(critical, key=lambda row: row.get("health_score") or 0)[:5]
        ],
        "report_gaps": [
            {"project_id": c["project_id"], "name": c["name"], "coverage": c["status_report"]["coverage"]}
            for c in missing_report[:8]
        ],
    }


def generate_weekly_briefing_md(facts: dict) -> str:
    totals = facts.get("totals") or {}
    period = facts.get("period") or {}
    lines = [
        f"# Briefing carteira — semana {period.get('start')} a {period.get('end')}",
        "",
        "## Resumo executivo",
        f"- **Clientes monitorizados:** {totals.get('clients', 0)}",
        f"- **Críticos:** {totals.get('critical', 0)} | **Atenção:** {totals.get('warning', 0)}",
        f"- **Reports incompletos:** {totals.get('missing_report', 0)}",
        "",
    ]
    top_critical = facts.get("top_critical") or []
    if top_critical:
        lines.append("## Top riscos (factos)")
        for row in top_critical:
            lines.append(
                f"- **{row['name']}** — score {row.get('health_score')}, "
                f"{row.get('overdue', 0)} cards atrasados"
            )
        lines.append("")
    report_gaps = facts.get("report_gaps") or []
    if report_gaps:
        lines.append("## Lacunas de status report")
        for row in report_gaps:
            lines.append(f"- {row['name']} ({row['coverage']})")
        lines.append("")
    lines.append("_Briefing gerado a partir dos dados Cliente 360 Operoz — revisão humana recomendada._")
    return "\n".join(lines)


def validate_briefing_qa(content_md: str, facts: dict) -> tuple[bool, list[str]]:
    issues: list[str] = []
    totals = facts.get("totals") or {}
    declared_clients = totals.get("clients", 0)
    if declared_clients and str(declared_clients) not in content_md:
        issues.append("missing_client_count")
    for row in facts.get("top_critical") or []:
        if row["name"] not in content_md:
            issues.append(f"missing_critical_client:{row['project_id']}")
    blocked = len(issues) > 2
    return not blocked, issues


def detect_scenarios(client_row: dict) -> list[str]:
    scenarios: list[str] = []
    coverage = (client_row.get("status_report") or {}).get("coverage")
    if coverage in ("missing", "partial"):
        scenarios.append("report_missing")
    if client_row.get("health") == "critical":
        scenarios.append("health_critical")
    support = client_row.get("support") or {}
    operational = client_row.get("operational") or {}
    sla = operational.get("support_sla") or {}
    if support.get("overdue_count", 0) > 0 or sla.get("breached"):
        scenarios.append("sla_breach")
    finops = client_row.get("finops") or {}
    if finops.get("variance_alert") or finops.get("margin_alert"):
        scenarios.append("finops_variance")
    return scenarios


def build_health_explainer(client_row: dict) -> dict:
    score = client_row.get("health_score")
    health = client_row.get("health")
    name = client_row.get("name", "Cliente")
    breakdown = client_row.get("health_breakdown") or []
    parts: list[str] = []
    for item in breakdown:
        dim = item.get("dimension", "")
        detail = item.get("detail") or ""
        dim_score = item.get("score")
        if detail:
            parts.append(f"- **{dim}** (score {dim_score}): {detail}")
    if health == "ok":
        tone = "positivo"
        lead = f"**{name}** está com saúde **saudável** (score {score}/100)."
    elif health == "warning":
        tone = "atenção"
        lead = f"**{name}** requer **atenção** (score {score}/100)."
    else:
        tone = "crítico"
        lead = f"**{name}** está **crítico** (score {score}/100)."
    explanation_md = "\n".join([lead, "", "Dimensões:", *parts]) if parts else lead
    static_fallback = explanation_md
    return {
        "tone": tone,
        "explanation_md": explanation_md,
        "static_fallback_md": static_fallback,
        "disclaimer": "Análise de entrega Operoz — não constitui aconselhamento médico ou legal.",
        "sources": [{"type": "health_breakdown", "dimensions": [b.get("dimension") for b in breakdown]}],
    }


def _action(
    key: str,
    *,
    title: str,
    reason: str,
    priority: int,
    href: str | None = None,
    action_type: str = "task",
) -> dict:
    return {
        "key": key,
        "title": title,
        "reason": reason,
        "priority": priority,
        "href": href,
        "action_type": action_type,
    }


def build_suggested_actions(client_row: dict, *, workspace_slug: str | None = None) -> list[dict]:
    actions: list[dict] = []
    pid = client_row.get("project_id")
    coverage = (client_row.get("status_report") or {}).get("coverage")
    if coverage in ("missing", "partial"):
        actions.append(
            _action(
                "publish_status_report",
                title="Publicar status report",
                reason=f"Cobertura actual: {coverage}",
                priority=1,
                href=f"/{workspace_slug}/projects/{pid}/issues" if workspace_slug and pid else None,
            )
        )
    overdue = (client_row.get("issues") or {}).get("overdue", 0)
    if overdue > 0:
        actions.append(
            _action(
                "review_overdue",
                title="Rever cards atrasados",
                reason=f"{overdue} cards com data vencida",
                priority=2,
                href=f"/{workspace_slug}/projects/{pid}/issues" if workspace_slug and pid else None,
            )
        )
    support_overdue = (client_row.get("support") or {}).get("overdue_count", 0)
    if support_overdue > 0:
        actions.append(
            _action(
                "triage_support",
                title="Triagem sustentação",
                reason=f"{support_overdue} chamados de sustentação em atraso",
                priority=2,
            )
        )
    operational = client_row.get("operational") or {}
    blockers = (operational.get("blockers") or {}).get("count", 0)
    if blockers > 0:
        actions.append(
            _action(
                "resolve_blockers",
                title="Resolver bloqueios",
                reason=f"{blockers} bloqueios activos",
                priority=3,
            )
        )
    if client_row.get("health_score_alert"):
        actions.append(
            _action(
                "health_review",
                title="Revisão de saúde",
                reason=f"Score {client_row.get('health_score')} abaixo do limiar",
                priority=1,
            )
        )
    if not actions:
        actions.append(
            _action(
                "preventive_check",
                title="Check-in preventivo",
                reason="Carteira estável — manter rituais semanais",
                priority=5,
                action_type="maintenance",
            )
        )
    actions.sort(key=lambda row: row["priority"])
    return actions[:MAX_SUGGESTED_ACTIONS]


def filter_dismissed_actions(
    actions: list[dict],
    *,
    project_id,
    member_id,
) -> list[dict]:
    if not member_id:
        return actions
    dismissed = set(
        Client360SuggestedActionDismissal.objects.filter(
            project_id=project_id,
            member_id=member_id,
            deleted_at__isnull=True,
        ).values_list("action_key", flat=True)
    )
    return [action for action in actions if action["key"] not in dismissed]


def ensure_default_scenario_playbooks(workspace_id) -> None:
    if WorkspaceClient360ScenarioPlaybook.objects.filter(
        workspace_id=workspace_id,
        deleted_at__isnull=True,
    ).exists():
        return
    for row in DEFAULT_SCENARIO_PLAYBOOKS:
        WorkspaceClient360ScenarioPlaybook.objects.create(
            workspace_id=workspace_id,
            scenario_key=row["scenario_key"],
            playbook_code=row["playbook_code"],
            title=row["title"],
            markdown=row["markdown"],
            locale="pt-BR",
            version=1,
            is_active=True,
        )


def resolve_scenario_playbooks(workspace_id, scenarios: list[str], *, locale: str = "pt-BR") -> list[dict]:
    ensure_default_scenario_playbooks(workspace_id)
    if not scenarios:
        return []
    rows = WorkspaceClient360ScenarioPlaybook.objects.filter(
        workspace_id=workspace_id,
        scenario_key__in=scenarios,
        locale=locale,
        is_active=True,
        deleted_at__isnull=True,
    )
    return [
        {
            "scenario_key": row.scenario_key,
            "playbook_code": row.playbook_code,
            "title": row.title,
            "markdown": row.markdown,
            "version": row.version,
            "locale": row.locale,
        }
        for row in rows
    ]


def serialize_weekly_briefing(row: WorkspaceClient360WeeklyBriefing | None) -> dict:
    if row is None:
        return {
            "content_md": "",
            "status": WorkspaceClient360WeeklyBriefing.STATUS_DRAFT,
            "requires_review": True,
            "generated_at": None,
            "cached": False,
        }
    return {
        "content_md": row.content_md,
        "status": row.status,
        "requires_review": row.requires_review,
        "qa_issues": row.qa_issues or [],
        "generated_at": row.generated_at.isoformat() if row.generated_at else None,
        "facts_hash": row.facts_hash,
        "cached": True,
        "period_start": row.period_start.isoformat(),
        "period_end": row.period_end.isoformat(),
    }


def upsert_weekly_briefing(
    *,
    workspace_id,
    period_start: date,
    period_end: date,
    content_md: str,
    facts_hash: str,
    qa_issues: list[str],
) -> WorkspaceClient360WeeklyBriefing:
    status = (
        WorkspaceClient360WeeklyBriefing.STATUS_BLOCKED
        if qa_issues
        else WorkspaceClient360WeeklyBriefing.STATUS_PUBLISHED
    )
    row, _ = WorkspaceClient360WeeklyBriefing.objects.update_or_create(
        workspace_id=workspace_id,
        period_start=period_start,
        defaults={
            "period_end": period_end,
            "content_md": content_md,
            "facts_hash": facts_hash,
            "status": status,
            "requires_review": True,
            "qa_issues": qa_issues,
            "prompt_version": PROMPT_VERSION,
            "generated_at": timezone.now(),
        },
    )
    return row


def serialize_qbr_draft(row: Client360QbrDraft | None) -> dict:
    if row is None:
        return {"content_md": "", "human_edited_md": "", "status": "draft", "generated_at": None}
    effective = (row.human_edited_md or row.content_md or "").strip()
    return {
        "quarter_key": row.quarter_key,
        "content_md": row.content_md,
        "human_edited_md": row.human_edited_md,
        "effective_md": effective,
        "status": row.status,
        "source_facts_hash": row.source_facts_hash,
        "generated_at": row.generated_at.isoformat() if row.generated_at else None,
    }


def generate_qbr_draft_md(context: dict) -> str:
    client = context.get("client") or {}
    name = client.get("name", "Cliente")
    quarter = context.get("quarter_key", "")
    narrative = context.get("narrative") or {}
    finops = context.get("finops") or {}
    health_history = context.get("health_history") or {}
    lines = [
        f"# QBR Draft — {name} ({quarter})",
        "",
        "## Wins",
        narrative.get("wins_md") or "_Sem wins registados — preencher após revisão._",
        "",
        "## Riscos",
        narrative.get("risks_md") or "_Sem riscos registados — validar com dados 360._",
        "",
        "## Métricas",
        f"- Score saúde: **{client.get('health_score')}** ({client.get('health')})",
        f"- Cards atrasados: **{(client.get('issues') or {}).get('overdue', 0)}**",
        f"- Sustentação aberta: **{(client.get('support') or {}).get('open_count', 0)}**",
    ]
    margin = finops.get("margin_pct")
    if margin is not None:
        lines.append(f"- Margem: **{margin}%**")
    elif finops.get("gaps"):
        lines.append("- Margem: _dados parciais — ver FinOps_")
    weeks = health_history.get("weeks") or []
    if weeks:
        lines.extend(["", "## Tendência saúde (últimas semanas)", ""])
        for week in weeks[-4:]:
            lines.append(f"- {week.get('period_start')}: score {week.get('health_score')} ({week.get('health')})")
    lines.extend(["", "_Draft gerado a partir de dados Cliente 360 — versão humana prevalece na exportação._"])
    return "\n".join(lines)


def build_snapshot_summary_text(snapshot: Client360HealthSnapshot, *, project_name: str) -> str:
    return (
        f"Cliente 360 snapshot semana {snapshot.period_start.isoformat()} — {project_name}. "
        f"Score {snapshot.health_score}/100, saúde {snapshot.health}."
    )


def retrieve_client_360_history(*, project_id, weeks: int = 8) -> dict:
    rows = list(
        Client360HealthSnapshot.objects.filter(
            project_id=project_id,
            deleted_at__isnull=True,
        )
        .order_by("-period_start")[:weeks]
    )
    rows.reverse()
    if not rows:
        return {"weeks": [], "gaps": True, "message": "Sem snapshots históricos para este cliente."}
    return {
        "weeks": [
            {
                "period_start": row.period_start.isoformat(),
                "period_end": row.period_end.isoformat(),
                "health_score": row.health_score,
                "health": row.health,
                "snapshot_id": str(row.id),
            }
            for row in rows
        ],
        "gaps": len(rows) < weeks,
    }


def prune_old_rag_snapshots(*, workspace_id) -> int:
    cutoff = timezone.now().date() - timedelta(weeks=RAG_SNAPSHOT_RETENTION_WEEKS)
    stale = Client360HealthSnapshot.objects.filter(
        workspace_id=workspace_id,
        period_start__lt=cutoff,
    )
    return stale.count()
