import type { TClient360Client, TClient360Summary } from "@operoz/types";

export function buildClient360PortfolioAiPayload(
  summary: TClient360Summary,
  clients: TClient360Client[],
  periodLabel: string
): { task: string; prompt: string } {
  const task =
    "Redija um briefing executivo em português do Brasil sobre a carteira de clientes Operoz. " +
    "Use 2 a 4 parágrafos curtos, tom profissional. " +
    "Cubra KPIs da semana, clientes críticos, status reports em falta e atrasos relevantes. " +
    "Termine com até 5 ações priorizadas (linhas que começam com «- »). " +
    "Não invente factos que não estejam nos dados.";

  const critical = clients.filter((c) => c.health === "critical").slice(0, 8);
  const missingReport = clients.filter((c) => c.status_report.coverage === "missing").slice(0, 8);
  const topOverdue = [...clients]
    .filter((c) => c.issues.overdue > 0)
    .sort((a, b) => b.issues.overdue - a.issues.overdue)
    .slice(0, 8);

  const formatClient = (c: TClient360Client) =>
    `- ${c.name} (${c.identifier}) — saúde ${c.health}, score ${c.health_score}, report ${c.status_report.coverage}, atrasados ${c.issues.overdue}`;

  const prompt = [
    `Período: ${periodLabel}`,
    "",
    "KPIs agregados:",
    `- Total clientes: ${summary.total_clients}`,
    `- Críticos: ${summary.health_critical}`,
    `- Atenção: ${summary.health_warning}`,
    `- Sem report: ${summary.report_missing}`,
    `- Cards atrasados (total): ${summary.total_overdue}`,
    `- Sustentação aberta: ${summary.total_support_open}`,
    "",
    "Clientes críticos (amostra):",
    critical.length ? critical.map(formatClient).join("\n") : "(nenhum)",
    "",
    "Sem status report (amostra):",
    missingReport.length ? missingReport.map(formatClient).join("\n") : "(nenhum)",
    "",
    "Mais atrasos (amostra):",
    topOverdue.length ? topOverdue.map(formatClient).join("\n") : "(nenhum)",
  ].join("\n");

  return { task, prompt };
}
