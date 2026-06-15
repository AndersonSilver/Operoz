import { format, isValid, parseISO } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";

const USER_LANGUAGE_STORAGE_KEY = "userLanguage";

function getLocale() {
  if (typeof window === "undefined") return ptBR;
  const stored = window.localStorage.getItem(USER_LANGUAGE_STORAGE_KEY);
  if (!stored || stored === "pt-BR") return ptBR;
  return enUS;
}

/** ISO datetime completo — não usar getDate/renderFormattedDate (só preserva o dia). */
function parseRunInstant(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const parsed = parseISO(iso);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(iso);
  return isValid(fallback) ? fallback : undefined;
}

export function formatRunDateTime(iso: string | null | undefined): string | undefined {
  const parsed = parseRunInstant(iso);
  if (!parsed) return undefined;
  return format(parsed, "dd MMM yyyy, HH:mm:ss", { locale: getLocale() });
}

export function splitRunDateTime(iso: string | null | undefined): { date?: string; time?: string } {
  const parsed = parseRunInstant(iso);
  if (!parsed) return {};
  const locale = getLocale();
  return {
    date: format(parsed, "dd MMM yyyy", { locale }),
    time: format(parsed, "HH:mm:ss", { locale }),
  };
}

export function getRunDurationMs(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined
): number | null {
  const start = parseRunInstant(startedAt);
  const end = parseRunInstant(finishedAt);
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return ms;
}

export function formatRunDurationLabel(
  ms: number,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (ms < 1000) {
    return t("boards.settings.automation.history.duration_ms", { value: ms });
  }
  if (ms < 60_000) {
    const seconds = (ms / 1000).toFixed(ms < 10_000 ? 1 : 0);
    return t("boards.settings.automation.history.duration_seconds", { value: seconds });
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (seconds === 0) {
    return t("boards.settings.automation.history.duration_minutes", { value: minutes });
  }
  return t("boards.settings.automation.history.duration_minutes_seconds", {
    minutes,
    seconds,
  });
}
