import type { TClient360DetailResponse } from "@operoz/types";

function moduleStatusLabel(status: string): string {
  if (status === "published") return "publicado";
  if (status === "draft") return "rascunho";
  return "em falta";
}

function coverageLabel(coverage: string): string {
  if (coverage === "missing") return "em falta";
  if (coverage === "partial") return "parcial";
  if (coverage === "complete") return "completa";
  return coverage;
}

export function buildClient360ClientBriefMd(data: TClient360DetailResponse, periodLabel: string): string {
  const sr = data.status_report;
  const missingModules = data.modules.filter((m) => m.status === "missing");
  const draftModules = data.modules.filter((m) => m.status === "draft");

  const lines = [
    `# Briefing — ${data.name}`,
    "",
    "## Resumo executivo",
    `- **Período:** ${periodLabel}`,
    `- **Saúde:** ${data.health} (score ${data.health_score}/100)`,
    `- **Status report:** ${sr.modules_published}/${sr.modules_total} módulos (${coverageLabel(sr.coverage)})`,
    `- **Cards atrasados:** ${data.issues.overdue}`,
    `- **Sustentação aberta:** ${data.support.open_count}`,
    "",
  ];

  if (missingModules.length > 0 || draftModules.length > 0) {
    lines.push("## Lacunas de status report");
    for (const mod of missingModules.slice(0, 8)) {
      lines.push(`- ${mod.module_name ?? data.name} (em falta)`);
    }
    for (const mod of draftModules.slice(0, 4)) {
      lines.push(`- ${mod.module_name ?? data.name} (rascunho)`);
    }
    lines.push("");
  }

  if (data.overdue_issues.length > 0) {
    lines.push("## Entregas em risco");
    for (const issue of data.overdue_issues.slice(0, 6)) {
      lines.push(`- #${issue.sequence_id} ${issue.name}`);
    }
    lines.push("");
  }

  if (data.support_issues.length > 0) {
    lines.push("## Sustentação");
    for (const issue of data.support_issues.slice(0, 6)) {
      lines.push(`- #${issue.sequence_id} ${issue.name}`);
    }
    lines.push("");
  }

  lines.push("## Ações recomendadas");
  if (sr.coverage !== "complete") {
    lines.push("- Publicar ou completar status reports da semana");
  }
  if (data.issues.overdue > 0) {
    lines.push(`- Revisar e replanear ${data.issues.overdue} card(s) atrasado(s)`);
  }
  if (data.support.open_count > 0) {
    lines.push(`- Priorizar ${data.support.open_count} chamado(s) de sustentação`);
  }
  if (sr.coverage === "complete" && data.issues.overdue === 0 && data.support.open_count === 0) {
    lines.push("- Manter ritmo — sem alertas prioritários nesta semana");
  }
  lines.push("");
  lines.push("_Briefing gerado a partir dos dados Cliente 360 Operoz — revisão humana recomendada._");

  return lines.join("\n");
}

export function buildClient360ClientBriefActions(data: TClient360DetailResponse): string[] {
  const actions: string[] = [];
  if (data.status_report.coverage !== "complete") {
    actions.push("Publicar ou completar status reports da semana");
  }
  if (data.issues.overdue > 0) {
    actions.push(`Revisar ${data.issues.overdue} card(s) atrasado(s)`);
  }
  if (data.support.open_count > 0) {
    actions.push(`Priorizar ${data.support.open_count} chamado(s) de sustentação`);
  }
  if (actions.length === 0) {
    actions.push("Manter ritmo — sem alertas prioritários nesta semana");
  }
  return actions.slice(0, 3);
}

export { moduleStatusLabel, coverageLabel };
