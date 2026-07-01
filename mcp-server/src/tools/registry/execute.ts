import type { OperozClient } from "../../client.js";
import type { ToolOperation } from "./types.js";

type Args = Record<string, unknown>;

function str(args: Args, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`Parâmetro obrigatório: ${key}`);
  }
  return v;
}

function objOptional(args: Args, key: string): Record<string, unknown> | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "object" || Array.isArray(v)) {
    throw new Error(`Parâmetro ${key} deve ser um objeto`);
  }
  return v as Record<string, unknown>;
}

function queryFrom(args: Args): Record<string, string | number | boolean | undefined> | undefined {
  const q = args.query;
  if (!q || typeof q !== "object" || Array.isArray(q)) return undefined;
  return q as Record<string, string | number | boolean | undefined>;
}

export function buildPath(template: string, args: Args): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = args[key];
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`Parâmetro de path obrigatório: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

export async function executeOperation(client: OperozClient, operation: ToolOperation, args: Args) {
  const path = buildPath(operation.path, args);
  const surface =
    operation.surface === "instances"
      ? "instances"
      : operation.surface === "auth"
        ? "auth"
        : operation.surface === "public"
          ? "public"
          : operation.surface;

  return client.request({
    surface: surface as "v1" | "app" | "instances" | "auth" | "public",
    method: operation.method,
    path,
    query: queryFrom(args),
    body: operation.body ? objOptional(args, "body") : undefined,
    form:
      operation.surface === "auth" && operation.method === "POST"
        ? (objOptional(args, "body") as Record<string, string> | undefined)
        : undefined,
  });
}

export function findOperation(operations: ToolOperation[], name: string): ToolOperation | undefined {
  return operations.find((o) => o.name === name);
}
