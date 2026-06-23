import type { ConsultoriaOperation } from "./registry/types.js";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s_/.-]+/)
    .filter((t) => t.length >= 2);
}

function score(op: ConsultoriaOperation, query: string, tokens: string[]): number {
  let s = 0;
  const name = op.name.toLowerCase();
  const desc = op.description.toLowerCase();
  const domain = op.domain.toLowerCase();
  const hay = `${name} ${desc} ${domain}`;

  if (hay.includes(query)) s += 20;
  if (name.includes(query)) s += 15;
  if (domain === query) s += 12;

  for (const t of tokens) {
    if (name.includes(t)) s += 5;
    if (desc.includes(t)) s += 3;
    if (domain.includes(t)) s += 4;
  }
  return s;
}

export function discoverConsultoriaOperations(
  operations: ConsultoriaOperation[],
  options: { query?: string; domain?: string; limit?: number }
) {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 25);
  let pool = operations;

  if (options.domain?.trim()) {
    pool = pool.filter((o) => o.domain === options.domain);
  }

  const query = options.query?.trim().toLowerCase();
  if (!query) return pool.slice(0, limit);

  const tokens = tokenize(query);
  const ranked = pool
    .map((op) => ({ op, s: score(op, query, tokens) }))
    .filter((e) => e.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit);

  return ranked.length ? ranked.map((e) => ({ ...e.op, score: e.s })) : pool.slice(0, limit);
}
