import type { TClient360ReportCoverage } from "@operis/types";

/** Evita polling de 5s do SWR em erro e revalidações desnecessárias no hub do board. */
export const CLIENT_360_SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
  errorRetryCount: 0,
  dedupingInterval: 60_000,
};

export function shiftWeekPeriod(start: string, deltaWeeks: number): { start: string; end: string } {
  const monday = new Date(`${start}T12:00:00`);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function defaultWeekPeriod(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

/** Valores financeiros FinOps — Real brasileiro (Operoz). */
export function formatClient360Currency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function reportCoverageLabelKey(coverage: TClient360ReportCoverage): string {
  switch (coverage) {
    case "complete":
      return "boards.client_360.report_complete";
    case "partial":
      return "boards.client_360.report_partial";
    case "missing":
      return "boards.client_360.report_missing";
    default:
      return "boards.client_360.report_na";
  }
}

export function reportCoverageHeatmapClass(coverage: TClient360ReportCoverage): string {
  switch (coverage) {
    case "complete":
      return "bg-success-subtle border-success-subtle hover:bg-success-primary/20";
    case "partial":
      return "bg-warning-subtle border-warning-subtle hover:bg-warning-primary/20";
    case "missing":
      return "bg-danger-subtle border-danger-subtle hover:bg-danger-primary/20";
    default:
      return "bg-layer-3 border-subtle hover:bg-layer-4";
  }
}

export function periodFromQuery(search: { get: (key: string) => string | null } | null): {
  start: string;
  end: string;
} | null {
  const start = search?.get("period_start");
  const end = search?.get("period_end");
  if (start && end) return { start, end };
  return null;
}
