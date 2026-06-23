import type { ConsultoriaApi } from "../operis-api.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Parâmetro obrigatório: ${key}`);
  return v.trim();
}

function strOpt(args: Args, key: string): string | undefined {
  const v = args[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

async function getProjectPrefix(api: ConsultoriaApi, projectId: string): Promise<string> {
  const project = await api.getProject(projectId);
  return `[${project.name}]`;
}

function applyPrefix(title: string, prefix: string): string {
  if (!prefix || title.startsWith(prefix)) return title;
  return `${prefix} - ${title}`;
}

export async function listTasks(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const cardId = str(args, "card_id");
  const result = await api.listSubIssues(projectId, cardId);
  return Array.isArray(result) ? result : ((result as any)?.sub_issues ?? []);
}

export async function createTask(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const cardId = str(args, "card_id");
  const body = (args.body ?? args) as Args;
  const prefix = await getProjectPrefix(api, projectId);

  return api.createIssue(projectId, {
    name: applyPrefix(str(body, "title"), prefix),
    description_html: strOpt(body, "description") ? `<p>${body.description}</p>` : undefined,
    parent: cardId,
    priority: strOpt(body, "priority") ?? "medium",
  });
}

export async function bulkCreateTasks(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const cardId = str(args, "card_id");
  const body = (args.body ?? args) as Args;
  const rawTasks = body.tasks;

  if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
    throw new Error("Campo 'tasks' deve ser um array não vazio de objetos com ao menos { title }");
  }

  return api.runBulk(async () => {
    const prefix = await getProjectPrefix(api, projectId);
    const created = [];

    for (const task of rawTasks as Args[]) {
      const issue = await api.createIssue(projectId, {
        name: applyPrefix(str(task, "title"), prefix),
        description_html: strOpt(task, "description") ? `<p>${task.description}</p>` : undefined,
        parent: cardId,
        priority: strOpt(task, "priority") ?? "medium",
      });

      created.push(issue);
    }

    return { created: created.length, tasks: created };
  });
}

export async function updateTask(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const taskId = str(args, "task_id");
  const body = (args.body ?? args) as Args;
  const patch: Record<string, unknown> = {};
  if (body.title) patch.name = body.title;
  if (body.description !== undefined) patch.description_html = body.description ? `<p>${body.description}</p>` : "";
  if (body.priority) patch.priority = body.priority;
  if (body.due_date !== undefined) patch.due_date = body.due_date ?? null;
  if (!Object.keys(patch).length) throw new Error("Nenhum campo para atualizar");
  return api.updateIssue(projectId, taskId, patch);
}

export async function updateTaskStatus(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const taskId = str(args, "task_id");
  const body = (args.body ?? args) as Args;
  const status = str(body, "status");

  const states = await api.listStates(projectId);
  const groupMap: Record<string, string[]> = {
    todo: ["backlog", "unstarted"],
    in_progress: ["started"],
    done: ["completed"],
    blocked: ["cancelled"],
  };
  const groups = groupMap[status] ?? [];
  const stateId = states.find((s) => groups.includes(String(s.group)))?.id;
  if (!stateId) throw new Error(`Não foi possível mapear status '${status}' para um state do projeto.`);

  return api.updateIssue(projectId, taskId, { state: stateId });
}

export async function deleteTask(api: ConsultoriaApi, args: Args) {
  const projectId = str(args, "project_id");
  const taskId = str(args, "task_id");
  await api.deleteIssue(projectId, taskId);
  return { ok: true, task_id: taskId };
}
