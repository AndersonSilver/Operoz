import type { TClient360DetailResponse } from "@operis/types";

function moduleStatusLabel(status: string): string {
  if (status === "published") return "publicado";
  if (status === "draft") return "rascunho";
  return "em falta";
}

export function buildClient360DetailAiPayload(
  data: TClient360DetailResponse,
  periodLabel: string
): { task: string; prompt: string } {
  const task =
    "Redija um briefing executivo em português do Brasil sobre este cliente para a gestão. " +
    "Use 2 a 3 parágrafos curtos, tom profissional e objetivo. " +
    "Cubra status report da semana, entregas em risco (atrasos) e sustentação se houver. " +
    "Termine com até 3 ações recomendadas (linhas que começam com «- »). " +
    "Não invente fatos, números ou nomes que não estejam nos dados.";

  const sr = data.status_report;
  const reportSummary =
    sr.modules_total > 0
      ? `${sr.modules_published}/${sr.modules_total} módulos publicados (cobertura: ${sr.coverage})`
      : `cobertura: ${sr.coverage}`;

  const moduleLines = data.modules
    .map((m) => {
      const label = m.module_name ?? "(nível projeto)";
      return `- ${label}: status report ${moduleStatusLabel(m.status)}`;
    })
    .join("\n");

  const overdueLines = data.overdue_issues
    .slice(0, 12)
    .map(
      (i) =>
        `- #${i.sequence_id} ${i.name}` +
        (i.target_date ? ` (alvo: ${i.target_date})` : "") +
        (i.state__name ? ` [${i.state__name}]` : "")
    )
    .join("\n");

  const supportLines = data.support_issues
    .slice(0, 12)
    .map(
      (i) =>
        `- #${i.sequence_id} ${i.name}` +
        (i.type__name ? ` (${i.type__name})` : "") +
        (i.state__name ? ` [${i.state__name}]` : "")
    )
    .join("\n");

  const prompt = [
    `Período: ${periodLabel}`,
    `Cliente: ${data.name} (${data.identifier})`,
    data.responsible_stakeholder ? `Stakeholder (cliente): ${data.responsible_stakeholder}` : null,
    data.project_lead?.display_name ? `Responsável (Operis): ${data.project_lead.display_name}` : null,
    `Saúde geral: ${data.health}`,
    "",
    "Indicadores:",
    `- Cards em aberto: ${data.issues.pending}`,
    `- Cards atrasados: ${data.issues.overdue}`,
    `- Chamados sustentação abertos: ${data.support.open_count}`,
    `- Status report da semana: ${reportSummary}`,
    "",
    "Status report por módulo:",
    moduleLines || "(sem módulos)",
    "",
    "Cards atrasados (amostra):",
    overdueLines || "(nenhum)",
    "",
    "Chamados sustentação (amostra):",
    supportLines || "(nenhum)",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { task, prompt };
}
