import type { Phase } from "./phases.js";
import { PHASES } from "./phases.js";

export type Paginated<T> = T[] | { results?: T[] };

/** Normaliza respostas paginadas da API v1 ({ results }) ou arrays diretos. */
export function asList<T>(payload: Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : (payload.results ?? []);
}

const PHASE_SET = new Set<string>(PHASES);

/** Issue-pai de fase: `[Projeto] KICKOFF` — tarefas usam `[Projeto] - título`. */
export function isPhaseCardIssue(name: string): boolean {
  return !name.includes("] - ");
}

export function parsePhaseFromIssueName(name: string): Phase | undefined {
  if (!isPhaseCardIssue(name)) return undefined;
  const match = name.match(/^\[[^\]]+\]\s+(.+)$/);
  if (!match) return undefined;
  const phaseKey = match[1].trim().replace(/ /g, "_");
  return PHASE_SET.has(phaseKey) ? (phaseKey as Phase) : undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Limite client-side de requisições por minuto. */
const API_REQUESTS_PER_MINUTE = 100;

/** Reserva slots numa janela deslizante. */
export class RequestBudget {
  private timestamps: number[] = [];

  constructor(
    private readonly maxPerWindow = API_REQUESTS_PER_MINUTE,
    private readonly windowMs = 60_000
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);

    if (this.timestamps.length >= this.maxPerWindow) {
      const oldest = this.timestamps[0] ?? now;
      const waitMs = this.windowMs - (now - oldest) + 250;
      await sleep(waitMs);
      return this.acquire();
    }

    this.timestamps.push(Date.now());
  }
}

export function retryDelayMs(error: { retryAfterMs?: number }, attempt: number): number {
  if (error.retryAfterMs && error.retryAfterMs > 0) {
    return error.retryAfterMs + 250;
  }
  // Sem Retry-After: espera reset da janela de 60s (escala com tentativas)
  return Math.min(65_000, 8_000 * (attempt + 1));
}

/** Resolve fase por label_details (expand) ou pelo padrão de nome do create_module. */
export function resolveIssuePhase(issue: {
  name?: string;
  label_details?: Array<{ name?: string }>;
}): Phase | undefined {
  const fromLabels = issue.label_details?.find((l) => l.name && PHASE_SET.has(l.name))?.name;
  if (fromLabels && PHASE_SET.has(fromLabels)) return fromLabels as Phase;
  return issue.name ? parsePhaseFromIssueName(issue.name) : undefined;
}

export function isPhaseCard(issue: {
  name?: string;
  parent?: unknown;
  label_details?: Array<{ name?: string }>;
}): boolean {
  if (issue.parent) return false;
  return resolveIssuePhase(issue) !== undefined;
}
