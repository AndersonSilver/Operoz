import type { OperozClient } from "../client.js";
import { OperozApiError } from "../client.js";
import { loadMcpProfile } from "../config.js";
import { discoverOperations } from "./discover.js";
import { ALL_OPERATIONS, OPERATIONS_BY_NAME, groupByDomain } from "./registry/index.js";
import { executeOperation, findOperation } from "./registry/execute.js";
import { AGENT_TOOL_NAMES, FULL_META_TOOL_NAMES } from "./registry/meta.js";
import { OPEROZ_REGISTRY_OPERATION_COUNT, OPEROZ_MCP_PROFILE } from "./definitions.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`Parâmetro obrigatório: ${key}`);
  }
  return v;
}

function queryFrom(args: Args): Record<string, string | boolean | undefined> | undefined {
  const q = args.query;
  if (!q || typeof q !== "object" || Array.isArray(q)) return undefined;
  return q as Record<string, string | boolean | undefined>;
}

function limitFrom(args: Args): number | undefined {
  const value = args.limit;
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Parâmetro limit deve ser um número");
  }
  return value;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  if (error instanceof OperozApiError) {
    return jsonResult({ error: error.message, status: error.status, body: error.body });
  }
  return jsonResult({
    error: error instanceof Error ? error.message : String(error),
  });
}

function isMetaTool(name: string): boolean {
  return FULL_META_TOOL_NAMES.has(name);
}

function buildCapabilities() {
  const domains = groupByDomain();
  const profile = loadMcpProfile();

  return {
    profile,
    exposed_tools: profile === "agent" ? AGENT_TOOL_NAMES.size : FULL_META_TOOL_NAMES.size + ALL_OPERATIONS.length,
    registry_operations: OPEROZ_REGISTRY_OPERATION_COUNT,
    workflow:
      profile === "agent" ? ["operoz_discover", "operoz_execute"] : ["operoz_list_operations ou endpoint directo"],
    auth: {
      v1: "Header X-Api-Key → OPEROZ_API_KEY ou Authorization: Bearer",
      app: "Header X-Api-Key → OPEROZ_API_KEY (recomendado); alternativa legada: operoz_sign_in ou OPEROZ_SESSION_COOKIE",
    },
    domains,
    surfaces: {
      v1: ALL_OPERATIONS.filter((o) => o.surface === "v1").length,
      app: ALL_OPERATIONS.filter((o) => o.surface === "app").length,
    },
    escape_hatch: ["operoz_api_v1_request", "operoz_api_app_request", "operoz_get_openapi_schema"],
  };
}

export async function handleToolCall(
  client: OperozClient,
  name: string,
  args: Args
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    if (isMetaTool(name)) {
      return handleMetaTool(client, name, args);
    }

    if (OPEROZ_MCP_PROFILE === "agent") {
      return jsonResult({
        error: `Ferramenta "${name}" não exposta no perfil agent.`,
        hint: "Use operoz_discover → operoz_execute, ou operoz_api_v1_request / operoz_api_app_request.",
      });
    }

    const operation = findOperation(ALL_OPERATIONS, name);
    if (!operation) {
      return jsonResult({
        error: `Ferramenta desconhecida: ${name}`,
        hint: "Use operoz_discover, operoz_list_operations ou operoz_get_capabilities",
      });
    }

    return jsonResult(await executeOperation(client, operation, args));
  } catch (error) {
    return errorResult(error);
  }
}

async function handleMetaTool(
  client: OperozClient,
  name: string,
  args: Args
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "operoz_get_capabilities":
      return jsonResult(buildCapabilities());

    case "operoz_discover": {
      const query = typeof args.query === "string" ? args.query : undefined;
      const domain = typeof args.domain === "string" ? args.domain : undefined;
      const surface = args.surface === "v1" || args.surface === "app" ? args.surface : undefined;
      const matches = discoverOperations(ALL_OPERATIONS, {
        query,
        domain,
        surface,
        limit: limitFrom(args),
      });

      return jsonResult({
        profile: OPEROZ_MCP_PROFILE,
        count: matches.length,
        next_step:
          matches.length > 0
            ? "Chame operoz_execute com operation=<name> e path params no top-level."
            : "Nenhuma operação encontrada para essa busca. Tente uma query mais genérica (menos palavras, termos do domínio em vez da intenção completa), remova o filtro de domain/surface, ou use operoz_get_capabilities para ver os domínios disponíveis.",
        matches,
      });
    }

    case "operoz_execute": {
      const operationName = str(args, "operation");
      const operation = OPERATIONS_BY_NAME.get(operationName) ?? findOperation(ALL_OPERATIONS, operationName);
      if (!operation) {
        return jsonResult({
          error: `Operação desconhecida: ${operationName}`,
          hint: "Use operoz_discover com query descritiva para obter o name correcto.",
        });
      }

      const executeArgs = { ...args };
      delete executeArgs.operation;

      return jsonResult(await executeOperation(client, operation, executeArgs));
    }

    case "operoz_list_operations": {
      let ops = ALL_OPERATIONS;
      if (typeof args.domain === "string" && args.domain.trim()) {
        ops = ops.filter((o) => o.domain === args.domain);
      }
      if (args.surface === "v1" || args.surface === "app") {
        ops = ops.filter((o) => o.surface === args.surface);
      }
      return jsonResult(
        ops.map((o) => ({
          name: o.name,
          domain: o.domain,
          surface: o.surface,
          method: o.method,
          path: o.path,
          description: o.description,
        }))
      );
    }

    case "operoz_get_openapi_schema": {
      const base = process.env.OPEROZ_API_BASE_URL ?? "http://localhost:8000";
      const data = await fetch(`${base.replace(/\/$/, "")}/api/schema/`, {
        headers: client.getSessionCookie() ? { Cookie: client.getSessionCookie()! } : {},
      });
      const text = await data.text();
      try {
        return jsonResult(JSON.parse(text));
      } catch {
        return jsonResult({ raw: text.slice(0, 12000), status: data.status });
      }
    }

    case "operoz_api_v1_request":
      return jsonResult(
        await client.request({
          surface: "v1",
          method: str(args, "method") as "GET",
          path: str(args, "path"),
          query: queryFrom(args),
          body: args.body,
        })
      );

    case "operoz_api_app_request":
      return jsonResult(
        await client.request({
          surface: "app",
          method: str(args, "method") as "GET",
          path: str(args, "path"),
          query: queryFrom(args),
          body: args.body,
        })
      );

    case "operoz_sign_in": {
      const result = await client.signIn(str(args, "email"), str(args, "password"));
      return jsonResult({
        ok: true,
        message:
          "Sessão guardada para chamadas /api/*. Nota: com OPEROZ_API_KEY configurado, este passo é dispensável.",
        ...result,
      });
    }

    default:
      return jsonResult({ error: `Meta tool não implementada: ${name}` });
  }
}
