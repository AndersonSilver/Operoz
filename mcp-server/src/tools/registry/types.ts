export type ApiSurface = "v1" | "app" | "instances" | "auth" | "public";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ToolOperation = {
  name: string;
  description: string;
  surface: ApiSurface;
  method: HttpMethod;
  /** Path relativo à superfície, ex: /workspaces/{workspace_slug}/pages/ */
  path: string;
  pathParams: string[];
  body?: boolean;
  query?: boolean;
  domain: string;
  /** JSON Schema do corpo — substitui "additionalProperties: true" quando presente */
  bodySchema?: Record<string, unknown>;
};

export function op(
  domain: string,
  name: string,
  description: string,
  surface: ApiSurface,
  method: HttpMethod,
  path: string,
  pathParams: string[],
  options?: { body?: boolean; query?: boolean; bodySchema?: Record<string, unknown> }
): ToolOperation {
  return {
    domain,
    name,
    description,
    surface,
    method,
    path,
    pathParams,
    body: options?.body,
    query: options?.query ?? method === "GET",
    ...(options?.bodySchema ? { bodySchema: options.bodySchema } : {}),
  };
}
