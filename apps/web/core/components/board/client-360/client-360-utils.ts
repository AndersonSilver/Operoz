import type { SWRConfiguration } from "swr";
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
