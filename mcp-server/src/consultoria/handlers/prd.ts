import type { ConsultoriaApi } from "../operoz-api.js";
import { isPhaseCard, resolveIssuePhase } from "../api-utils.js";
import { bulkCreateTasks } from "./tasks.js";
import type { Phase } from "../phases.js";

type Args = Record<string, unknown>;

const PRD_MARKER = "<!--CONSULTORIA_PRD-->";

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Parâmetro obrigatório: ${key}`);
  return v.trim();
}

/** Serializa PRD na descrição do módulo usando um marcador invisível. */
function encodePrd(content: string, status: string, approvedAt?: string): string {
  const meta = JSON.stringify({ status, approved_at: approvedAt ?? null, content });
  return `${PRD_MARKER}${meta}`;
}

function decodePrd(description: string): { status: string; approved_at: string | null; content: string } | null {
  const idx = description?.indexOf(PRD_MARKER);
  if (idx === -1 || idx === undefined) return null;
  try {
    return JSON.parse(description.slice(idx + PRD_MARKER.length));
  } catch {
    return null;
  }
}

async function getPhaseIssueId(
  api: ConsultoriaApi,
  projectId: string,
  moduleId: string,
  phase: Phase
): Promise<string> {
  const list = await api.listModuleIssues(projectId, moduleId);
  const found = list.find((i) => isPhaseCard(i) && resolveIssuePhase(i) === phase);
  if (!found) throw new Error(`Issue da fase ${phase} não encontrada no módulo ${moduleId}.`);
  return found.id as string;
}

export async function registerPrd(api: ConsultoriaApi, args: Args) {
  const body = (args.body ?? args) as Args;
  const projectId = str(body, "project_id");
  const moduleId = str(body, "module_id");
  const content = str(body, "content");
  const status = (body.status as string | undefined) ?? "pending";

  const encoded = encodePrd(content, status);
  await api.updateModule(projectId, moduleId, { description: encoded });

  return { ok: true, module_id: moduleId, status, content };
}

export async function approvePrd(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const moduleId = str(args, "module_id");

  const module = await api.getModule(projectId, moduleId);

  const prd = decodePrd(String(module.description ?? ""));
  if (!prd) throw new Error("Nenhum PRD registrado neste módulo. Use register_prd primeiro.");
  if (prd.status === "approved") return { ok: true, message: "PRD já estava aprovado.", prd };

  const approvedAt = new Date().toISOString();
  const encoded = encodePrd(prd.content, "approved", approvedAt);
  await api.updateModule(projectId, moduleId, { description: encoded });

  return {
    ok: true,
    approved_at: approvedAt,
    prd_content: prd.content,
    next_step:
      "PRD aprovado. Leia o conteúdo acima e chame generate_from_prd passando:\n" +
      "- tasks_development: [{ title, description }] para DESENVOLVIMENTO\n" +
      "- tasks_hom_interna: [{ title, description }] para HOMOLOGACAO_INTERNA\n" +
      "- tasks_hom_externa: [{ title, description }] para HOMOLOGACAO_EXTERNA",
  };
}

export async function generateFromPrd(api: ConsultoriaApi, args: Args) {
  const body = (args.body ?? args) as Args;
  const projectId = str(body, "project_id");
  const moduleId = str(body, "module_id");

  const module = await api.getModule(projectId, moduleId);

  const prd = decodePrd(String(module.description ?? ""));
  if (!prd) throw new Error("Nenhum PRD registrado neste módulo.");
  if (prd.status !== "approved") throw new Error("O PRD precisa estar aprovado antes de gerar tarefas.");

  const phaseKeys: Array<{ bodyKey: string; phase: Phase }> = [
    { bodyKey: "tasks_development", phase: "DESENVOLVIMENTO" },
    { bodyKey: "tasks_hom_interna", phase: "HOMOLOGACAO_INTERNA" },
    { bodyKey: "tasks_hom_externa", phase: "HOMOLOGACAO_EXTERNA" },
  ];

  const results: Record<string, unknown> = {};

  for (const { bodyKey, phase } of phaseKeys) {
    const tasks = body[bodyKey];
    if (!Array.isArray(tasks) || tasks.length === 0) continue;

    const phaseIssueId = await getPhaseIssueId(api, projectId, moduleId, phase);

    results[phase] = await bulkCreateTasks(api, {
      project_id: projectId,
      card_id: phaseIssueId,
      module_id: moduleId,
      tasks,
    });
  }

  if (!Object.keys(results).length) {
    throw new Error("Informe ao menos um campo: tasks_development, tasks_hom_interna ou tasks_hom_externa.");
  }

  return { ok: true, generated: results, message: "Tarefas criadas nas fases dinâmicas a partir do PRD." };
}

export async function getPrd(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const moduleId = str(args, "module_id");

  const module = await api.getModule(projectId, moduleId);

  const prd = decodePrd(String(module.description ?? ""));
  if (!prd) throw new Error("Nenhum PRD encontrado neste módulo.");
  return prd;
}
