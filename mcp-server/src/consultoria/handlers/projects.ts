import type { ConsultoriaApi } from "../operis-api.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Parâmetro obrigatório: ${key}`);
  return v.trim();
}

export async function listProjects(api: ConsultoriaApi, args: Args) {
  const projects = await api.listProjects();
  if (typeof args.status === "string") {
    return projects.filter((p: any) => p.network === args.status || p.status === args.status);
  }
  return projects;
}

export async function getProject(api: ConsultoriaApi, args: Args) {
  return api.getProject(str(args, "project_id"));
}

export async function createProject(api: ConsultoriaApi, args: Args) {
  const body = (args.body ?? args) as Args;
  const name = str(body, "name");
  return api.createProject({
    name,
    identifier:
      (body.identifier as string | undefined) ??
      name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 5),
    description: (body.description as string | undefined) ?? "",
    network: 2,
  });
}

export async function updateProject(api: ConsultoriaApi, args: Args) {
  const id = str(args, "project_id");
  const body = (args.body ?? args) as Args;
  const patch: Record<string, unknown> = {};
  if (body.name) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  return api.updateProject(id, patch);
}

export async function archiveProject(api: ConsultoriaApi, args: Args) {
  const id = str(args, "project_id");
  await api.archiveProject(id);
  return { ok: true, project_id: id };
}
