import type { ConsultoriaApi } from "../operis-api.js";
import { isPhaseCard, resolveIssuePhase } from "../api-utils.js";
import { PHASES } from "../phases.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Parâmetro obrigatório: ${key}`);
  return v.trim();
}

/** Resolve state_id a partir de um status semântico (todo/in_progress/done/blocked) */
async function resolveStateId(api: ConsultoriaApi, projectId: string, status: string): Promise<string | undefined> {
  const states = await api.listStates(projectId);
  const groupMap: Record<string, string[]> = {
    todo: ["backlog", "unstarted"],
    in_progress: ["started"],
    done: ["completed"],
    blocked: ["cancelled"],
  };
  const groups = groupMap[status] ?? [];
  const found = states.find((s) => groups.includes(String(s.group)));
  return found?.id as string | undefined;
}

export async function listCards(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const moduleId = str(args, "module_id");

  const moduleIssues = await api.listModuleIssues(projectId, moduleId);

  const cards = moduleIssues
    .filter((i) => isPhaseCard(i))
    .map((i) => ({
      id: i.id,
      phase: resolveIssuePhase(i),
      name: i.name,
      state: (i as { state_detail?: { name?: string } }).state_detail?.name,
      state_group: (i as { state_detail?: { group?: string } }).state_detail?.group,
      priority: i.priority,
      start_date: i.start_date,
      due_date: i.due_date,
    }))
    .sort((a, b) => PHASES.indexOf(a.phase!) - PHASES.indexOf(b.phase!));

  return cards;
}

export async function getCard(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const issueId = str(args, "card_id");

  const issue = await api.getIssue(projectId, issueId);
  const subIssues = await api.listSubIssues(projectId, issueId);

  return {
    ...issue,
    tasks: Array.isArray(subIssues) ? subIssues : ((subIssues as any)?.sub_issues ?? []),
  };
}

export async function updateCardStatus(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const issueId = str(args, "card_id");
  const body = (args.body ?? args) as Args;
  const status = str(body, "status");

  const stateId = await resolveStateId(api, projectId, status);
  if (!stateId) throw new Error(`Não foi possível mapear status '${status}' para um state do projeto.`);

  return api.updateIssue(projectId, issueId, { state: stateId });
}

export async function setCardDates(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const issueId = str(args, "card_id");
  const body = (args.body ?? args) as Args;
  const patch: Record<string, unknown> = {};
  if (body.start_date) patch.start_date = body.start_date;
  if (body.due_date) patch.due_date = body.due_date;
  if (!Object.keys(patch).length) throw new Error("Informe start_date e/ou due_date");
  return api.updateIssue(projectId, issueId, patch);
}
