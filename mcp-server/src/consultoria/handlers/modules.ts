import type { ConsultoriaApi } from "../operoz-api.js";
import { FIXED_PHASE_TASKS, PHASE_COLORS, PHASES, type Phase } from "../phases.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Parâmetro obrigatório: ${key}`);
  return v.trim();
}

export { PHASES, type Phase };

/** Garante que existem labels para as fases, retorna mapa fase→labelId */
async function ensurePhaseLabels(api: ConsultoriaApi, projectId: string): Promise<Map<Phase, string>> {
  const existing = await api.listLabels(projectId);
  const labelMap = new Map<Phase, string>();

  for (const phase of PHASES) {
    const found = existing.find((l) => l.name === phase);
    if (found) {
      labelMap.set(phase, found.id as string);
    } else {
      const created = await api.createLabel(projectId, {
        name: phase,
        color: PHASE_COLORS[phase],
      });
      labelMap.set(phase, created.id as string);
    }
  }

  return labelMap;
}

export async function listModules(api: ConsultoriaApi, args: Args) {
  return api.listModules(str(args, "project_id"));
}

export async function createModule(api: ConsultoriaApi, args: Args) {
  const body = (args.body ?? args) as Args;
  const projectId = str(body, "project_id");
  const moduleName = str(body, "name");

  return api.runBulk(async () => {
    const project = await api.getProject(projectId);
    const projectPrefix = `[${project.name}]`;

    const module = await api.createModule(projectId, { name: moduleName });
    const labelMap = await ensurePhaseLabels(api, projectId);

    const phaseIssues: Record<string, string> = {};

    for (const phase of PHASES) {
      const phaseIssue = await api.createIssue(projectId, {
        name: `${projectPrefix} ${phase.replace(/_/g, " ")}`,
        label_ids: [labelMap.get(phase)!],
        priority: "medium",
      });
      phaseIssues[phase] = phaseIssue.id as string;

      await api.addIssueToModule(projectId, module.id as string, [phaseIssue.id as string]);

      const templates = FIXED_PHASE_TASKS[phase];
      if (templates) {
        for (const title of templates) {
          await api.createIssue(projectId, {
            name: `${projectPrefix} - ${title}`,
            parent: phaseIssue.id,
            label_ids: [labelMap.get(phase)!],
            priority: "medium",
          });
        }
      }
    }

    const totalTemplateTasks = Object.values(FIXED_PHASE_TASKS).flat().length;

    return {
      module,
      phase_issues: phaseIssues,
      tasks_created: totalTemplateTasks,
      next_step:
        "Módulo criado com 8 fases e tarefas-template visíveis no Operoz. " +
        "Você já tem o PRD pronto? Se sim, use register_prd para registrá-lo. " +
        "As fases DESENVOLVIMENTO, HOMOLOGACAO_INTERNA e HOMOLOGACAO_EXTERNA aguardam o PRD aprovado.",
    };
  });
}

export async function updateModule(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const moduleId = str(args, "module_id");
  const body = (args.body ?? args) as Args;
  const patch: Record<string, unknown> = {};
  if (body.name) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  return api.updateModule(projectId, moduleId, patch);
}

export async function deleteModule(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const moduleId = str(args, "module_id");
  await api.deleteModule(projectId, moduleId);
  return { ok: true, module_id: moduleId };
}
