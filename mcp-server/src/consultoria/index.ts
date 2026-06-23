import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { OperisClient } from "../client.js";
import { ConsultoriaApi, getWsSlug } from "./operis-api.js";
import { discoverConsultoriaOperations } from "./discover.js";
import { archiveProject, createProject, getProject, listProjects, updateProject } from "./handlers/projects.js";
import { createModule, deleteModule, listModules, updateModule } from "./handlers/modules.js";
import { getCard, listCards, setCardDates, updateCardStatus } from "./handlers/cards.js";
import { bulkCreateTasks, createTask, deleteTask, listTasks, updateTask, updateTaskStatus } from "./handlers/tasks.js";
import { approvePrd, generateFromPrd, getPrd, registerPrd } from "./handlers/prd.js";
import { ALL_CONSULTORIA_OPERATIONS, CONSULTORIA_OPERATIONS_BY_NAME, groupByDomain } from "./registry/index.js";

type Args = Record<string, unknown>;

export const CONSULTORIA_TOOLS: Tool[] = [
  {
    name: "consultoria_get_capabilities",
    description: "Mapa de domínios e operações do MCP de Consultoria Operis.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "consultoria_discover",
    description:
      "Descobre operações de consultoria por intenção (ex: criar módulo, aprovar PRD, listar tarefas). " +
      "Devolve name e params para consultoria_execute.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Intenção: criar projeto, listar módulos, aprovar PRD…" },
        domain: {
          type: "string",
          enum: ["projects", "modules", "cards", "tasks", "prd"],
          description: "Filtrar por domínio",
        },
        limit: { type: "number", description: "Máximo de resultados (1–25, default 10)" },
      },
    },
  },
  {
    name: "consultoria_execute",
    description:
      "Executa uma operação de consultoria pelo name (obtido de consultoria_discover). " +
      "Parâmetros no top-level ou em body{}. Requer workspace_slug (ou env OPERIS_WORKSPACE_SLUG) e project_id para a maioria das operações.",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Nome da operação (ex: create_module, approve_prd)" },
        workspace_slug: {
          type: "string",
          description: "Slug do workspace (opcional se OPERIS_WORKSPACE_SLUG está definido)",
        },
        body: { type: "object", description: "Parâmetros da operação", additionalProperties: true },
      },
      required: ["operation"],
      additionalProperties: true,
    },
  },
];

type Handler = (api: ConsultoriaApi, args: Args) => Promise<unknown>;

const HANDLERS: Record<string, Handler> = {
  list_projects: listProjects,
  get_project: getProject,
  create_project: createProject,
  update_project: updateProject,
  archive_project: archiveProject,
  list_modules: listModules,
  create_module: createModule,
  update_module: updateModule,
  delete_module: deleteModule,
  list_cards: listCards,
  get_card: getCard,
  update_card_status: updateCardStatus,
  set_card_dates: setCardDates,
  list_tasks: listTasks,
  create_task: createTask,
  bulk_create_tasks: bulkCreateTasks,
  update_task: updateTask,
  update_task_status: updateTaskStatus,
  delete_task: deleteTask,
  register_prd: registerPrd,
  approve_prd: approvePrd,
  generate_from_prd: generateFromPrd,
  get_prd: getPrd,
};

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(error: unknown) {
  return jsonResult({ error: error instanceof Error ? error.message : String(error) });
}

export async function handleConsultoriaCall(client: OperisClient | null, name: string, args: Args) {
  try {
    if (name === "consultoria_get_capabilities") {
      return jsonResult({
        total_operations: ALL_CONSULTORIA_OPERATIONS.length,
        domains: groupByDomain(),
        workflow: ["consultoria_discover", "consultoria_execute"],
        note: "Requer OPERIS_SESSION_COOKIE + OPERIS_WORKSPACE_SLUG configurados.",
      });
    }

    if (name === "consultoria_discover") {
      const matches = discoverConsultoriaOperations(ALL_CONSULTORIA_OPERATIONS, {
        query: typeof args.query === "string" ? args.query : undefined,
        domain: typeof args.domain === "string" ? args.domain : undefined,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
      return jsonResult({
        count: matches.length,
        next_step: "Chame consultoria_execute com operation=<name>",
        matches,
      });
    }

    if (name === "consultoria_execute") {
      const opName = args.operation;
      if (typeof opName !== "string" || !opName.trim()) {
        return jsonResult({ error: "Parâmetro obrigatório: operation" });
      }

      if (!CONSULTORIA_OPERATIONS_BY_NAME.has(opName)) {
        return jsonResult({
          error: `Operação desconhecida: ${opName}`,
          hint: "Use consultoria_discover para encontrar o nome correto.",
        });
      }

      if (!client) {
        return jsonResult({
          error: "Cliente Operis não disponível. Configure OPERIS_SESSION_COOKIE ou OPERIS_API_KEY.",
        });
      }

      const wsSlug = getWsSlug(args);
      const api = new ConsultoriaApi(client, wsSlug);

      const execArgs = { ...args };
      delete execArgs.operation;
      delete execArgs.workspace_slug;

      return jsonResult(await HANDLERS[opName](api, execArgs));
    }

    return jsonResult({ error: `Tool desconhecida: ${name}` });
  } catch (error) {
    return errorResult(error);
  }
}
