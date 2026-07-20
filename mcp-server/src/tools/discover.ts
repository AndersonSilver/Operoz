import type { ToolOperation } from "./registry/types.js";

export type DiscoverMatch = {
  name: string;
  domain: string;
  surface: string;
  method: string;
  path: string;
  description: string;
  pathParams: string[];
  body?: boolean;
  query?: boolean;
  bodySchema?: Record<string, unknown>;
  score?: number;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s_/.-]+/)
    .filter((token) => token.length >= 2);
}

function toMatch(operation: ToolOperation, score?: number): DiscoverMatch {
  return {
    name: operation.name,
    domain: operation.domain,
    surface: operation.surface,
    method: operation.method,
    path: operation.path,
    description: operation.description,
    pathParams: operation.pathParams,
    ...(operation.body ? { body: true } : {}),
    ...(operation.query ? { query: true } : {}),
    ...(operation.bodySchema ? { bodySchema: operation.bodySchema } : {}),
    ...(score !== undefined && score > 0 ? { score } : {}),
  };
}

function scoreOperation(operation: ToolOperation, query: string, queryTokens: string[]): number {
  let score = 0;
  const name = operation.name.toLowerCase();
  const description = operation.description.toLowerCase();
  const path = operation.path.toLowerCase();
  const domain = operation.domain.toLowerCase();
  const haystack = `${name} ${description} ${path} ${domain}`;

  if (haystack.includes(query)) score += 20;
  if (name.includes(query)) score += 15;
  if (domain === query) score += 12;

  for (const token of queryTokens) {
    if (name.includes(token)) score += 5;
    if (description.includes(token)) score += 3;
    if (path.includes(token)) score += 2;
    if (domain.includes(token)) score += 4;
  }

  return score;
}

export function discoverOperations(
  operations: ToolOperation[],
  options: {
    query?: string;
    domain?: string;
    surface?: "v1" | "app";
    limit?: number;
  }
): DiscoverMatch[] {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 25);
  let pool = operations;

  const domain = options.domain?.trim();
  if (domain) {
    pool = pool.filter((operation) => operation.domain === domain);
  }

  if (options.surface === "v1" || options.surface === "app") {
    pool = pool.filter((operation) => operation.surface === options.surface);
  }

  const query = options.query?.trim().toLowerCase();
  if (!query) {
    return pool.slice(0, limit).map((operation) => toMatch(operation));
  }

  const queryTokens = tokenize(query);
  const ranked = pool
    .map((operation) => ({
      operation,
      score: scoreOperation(operation, query, queryTokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Query informada mas sem nenhum match de relevância: não inventa resultado.
  // Devolver operações aleatórias do pool faria parecer que aquilo é o que foi pedido.
  if (ranked.length === 0) {
    return [];
  }

  return ranked.map(({ operation, score }) => toMatch(operation, score));
}
