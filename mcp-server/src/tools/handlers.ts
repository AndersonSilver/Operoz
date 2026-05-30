import type { OperisClient } from "../client.js";
import { OperisApiError } from "../client.js";
import { ALL_OPERATIONS, OPERATIONS_BY_NAME, groupByDomain } from "./registry/index.js";
import { executeOperation, findOperation } from "./registry/execute.js";
import { META_TOOL_NAMES } from "./registry/meta.js";

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

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  if (error instanceof OperisApiError) {
    return jsonResult({ error: error.message, status: error.status, body: error.body });
  }
  return jsonResult({
    error: error instanceof Error ? error.message : String(error),
  });
}

function buildCapabilities() {
  const domains = groupByDomain();
  return {
    total_tools: ALL_OPERATIONS.length + META_TOOL_NAMES.size,
    registry_operations: ALL_OPERATIONS.length,
    auth: {
      v1: "Header X-Api-Key → OPERIS_API_KEY ou Authorization: Bearer",
      app: "Cookie de sessão → operis_sign_in, OPERIS_SESSION_COOKIE ou X-Operis-Session",
    },
    domains,
    surfaces: {
      v1: ALL_OPERATIONS.filter((o) => o.surface === "v1").length,
      app: ALL_OPERATIONS.filter((o) => o.surface === "app").length,
    },
    escape_hatch: ["operis_api_v1_request", "operis_api_app_request", "operis_get_openapi_schema"],
  };
}

export async function handleToolCall(
  client: OperisClient,
  name: string,
  args: Args,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    if (META_TOOL_NAMES.has(name)) {
      return handleMetaTool(client, name, args);
    }

    const operation = findOperation(ALL_OPERATIONS, name);
    if (!operation) {
      return jsonResult({
        error: `Ferramenta desconhecida: ${name}`,
        hint: "Use operis_list_operations ou operis_get_capabilities",
      });
    }

    return jsonResult(await executeOperation(client, operation, args));
  } catch (error) {
    return errorResult(error);
  }
}

async function handleMetaTool(
  client: OperisClient,
  name: string,
  args: Args,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "operis_get_capabilities":
      return jsonResult(buildCapabilities());

    case "operis_list_operations": {
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
        })),
      );
    }

    case "operis_get_openapi_schema": {
      const base = process.env.OPERIS_API_BASE_URL ?? "http://localhost:8000";
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

    case "operis_api_v1_request":
      return jsonResult(
        await client.request({
          surface: "v1",
          method: str(args, "method") as "GET",
          path: str(args, "path"),
          query: queryFrom(args),
          body: args.body,
        }),
      );

    case "operis_api_app_request":
      return jsonResult(
        await client.request({
          surface: "app",
          method: str(args, "method") as "GET",
          path: str(args, "path"),
          query: queryFrom(args),
          body: args.body,
        }),
      );

    case "operis_sign_in": {
      const result = await client.signIn(str(args, "email"), str(args, "password"));
      return jsonResult({
        ok: true,
        message: "Sessão guardada para chamadas /api/*.",
        ...result,
      });
    }

    default:
      return jsonResult({ error: `Meta tool não implementada: ${name}` });
  }
}
