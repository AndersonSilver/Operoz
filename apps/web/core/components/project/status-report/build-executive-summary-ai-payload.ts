import { observationLineToPlainText } from "@/components/project/status-report/observation-content";

function formatLines(lines: string[], emptyLabel: string): string {
  if (!lines.length) return emptyLabel;
  return lines.map((line) => `- ${observationLineToPlainText(line)}`).join("\n");
}

export function buildExecutiveSummaryAiPayload(params: {
  weekLabel: string;
  periodDatesLabel: string;
  moduleName?: string;
  projectName: string;
  emExecucaoLines: string[];
  pontosAtencaoLines: string[];
}): { task: string; prompt: string } {
  const { weekLabel, periodDatesLabel, moduleName, projectName, emExecucaoLines, pontosAtencaoLines } =
    params;

  const task =
    "Redija um resumo executivo conciso em português do Brasil para um status report semanal. " +
    "Use um único parágrafo (3 a 6 frases), tom profissional e objetivo. " +
    "Integre andamento e riscos quando existirem. Não use listas com marcadores nem títulos. " +
    "Não invente fatos, números ou datas que não estejam nas observações fornecidas.";

  const prompt = [
    "Contexto do relatório:",
    `Semana: ${weekLabel} (${periodDatesLabel})`,
    moduleName ? `Módulo: ${moduleName}` : null,
    `Projeto: ${projectName}`,
    "",
    "Em execução:",
    formatLines(emExecucaoLines, "(nenhum item)"),
    "",
    "Pontos de atenção:",
    formatLines(pontosAtencaoLines, "(nenhum item)"),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { task, prompt };
}
