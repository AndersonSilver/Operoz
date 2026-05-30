/**

 * Copyright (c) 2023-present Plane Software, Inc. and contributors

 * SPDX-License-Identifier: AGPL-3.0-only

 * See the LICENSE file for details.

 */



import type { TClient360Client, TClient360Health, TClient360ReportCoverage } from "@plane/types";



export type Client360SortColumn =

  | "name"

  | "health"

  | "report"

  | "overdue"

  | "support"

  | "stakeholder"

  | "responsible";



export type Client360SortDirection = "asc" | "desc";



/** Refines how the active column is compared (e.g. name vs identifier, report coverage vs progress). */

export type Client360SortMode = "default" | "identifier" | "progress";



export type Client360SortState = {

  column: Client360SortColumn;

  direction: Client360SortDirection;

  mode?: Client360SortMode;

};



export type Client360SortMenuOption = {

  labelKey: string;

  state: Client360SortState;

};



const SORT_STORAGE_KEY = "client360_clients_sort";



const SORT_COLUMNS: Client360SortColumn[] = [

  "name",

  "health",

  "report",

  "overdue",

  "support",

  "stakeholder",

  "responsible",

];



const SORT_MODES: Client360SortMode[] = ["default", "identifier", "progress"];



const HEALTH_ORDER: Record<TClient360Health, number> = {

  critical: 0,

  warning: 1,

  ok: 2,

};



const REPORT_ORDER: Record<TClient360ReportCoverage, number> = {

  missing: 0,

  partial: 1,

  complete: 2,

  n_a: 3,

};



export const DEFAULT_CLIENT360_SORT: Client360SortState = {

  column: "health",

  direction: "asc",

};



export function normalizeClient360SortMode(mode?: Client360SortMode): Client360SortMode {

  return mode && SORT_MODES.includes(mode) ? mode : "default";

}



export function client360SortStatesEqual(a: Client360SortState, b: Client360SortState): boolean {

  return (

    a.column === b.column &&

    a.direction === b.direction &&

    normalizeClient360SortMode(a.mode) === normalizeClient360SortMode(b.mode)

  );

}



export function getClient360SortOptionsForColumn(column: Client360SortColumn): Client360SortMenuOption[] {

  const base = (direction: Client360SortDirection, mode?: Client360SortMode): Client360SortState => ({

    column,

    direction,

    ...(mode ? { mode } : {}),

  });



  switch (column) {

    case "name":

      return [

        { labelKey: "boards.client_360.sort_name_asc", state: base("asc") },

        { labelKey: "boards.client_360.sort_name_desc", state: base("desc") },

        { labelKey: "boards.client_360.sort_identifier_asc", state: base("asc", "identifier") },

        { labelKey: "boards.client_360.sort_identifier_desc", state: base("desc", "identifier") },

      ];

    case "health":

      return [

        { labelKey: "boards.client_360.sort_health_worst", state: base("asc") },

        { labelKey: "boards.client_360.sort_health_best", state: base("desc") },

      ];

    case "report":

      return [

        { labelKey: "boards.client_360.sort_report_missing_first", state: base("asc") },

        { labelKey: "boards.client_360.sort_report_complete_first", state: base("desc") },

        { labelKey: "boards.client_360.sort_report_progress_desc", state: base("desc", "progress") },

        { labelKey: "boards.client_360.sort_report_progress_asc", state: base("asc", "progress") },

      ];

    case "overdue":

      return [

        { labelKey: "boards.client_360.sort_count_desc", state: base("desc") },

        { labelKey: "boards.client_360.sort_count_asc", state: base("asc") },

      ];

    case "support":

      return [

        { labelKey: "boards.client_360.sort_count_desc", state: base("desc") },

        { labelKey: "boards.client_360.sort_count_asc", state: base("asc") },

      ];

    case "stakeholder":

    case "responsible":

      return [

        { labelKey: "boards.client_360.sort_alpha_asc", state: base("asc") },

        { labelKey: "boards.client_360.sort_alpha_desc", state: base("desc") },

      ];

    default:

      return [];

  }

}



export function loadClient360Sort(boardSlug: string): Client360SortState {

  if (typeof window === "undefined") return DEFAULT_CLIENT360_SORT;

  try {

    const raw = localStorage.getItem(`${SORT_STORAGE_KEY}_${boardSlug}`);

    if (!raw) return DEFAULT_CLIENT360_SORT;

    const parsed = JSON.parse(raw) as Client360SortState;

    if (

      parsed?.column &&

      SORT_COLUMNS.includes(parsed.column) &&

      (parsed.direction === "asc" || parsed.direction === "desc")

    ) {

      return {

        column: parsed.column,

        direction: parsed.direction,

        ...(parsed.mode && SORT_MODES.includes(parsed.mode) ? { mode: parsed.mode } : {}),

      };

    }

  } catch {

    /* ignore */

  }

  return DEFAULT_CLIENT360_SORT;

}



export function saveClient360Sort(boardSlug: string, sort: Client360SortState) {

  try {

    localStorage.setItem(`${SORT_STORAGE_KEY}_${boardSlug}`, JSON.stringify(sort));

  } catch {

    /* ignore */

  }

}



function reportProgress(client: TClient360Client): number {

  const { modules_total, modules_published } = client.status_report;

  if (modules_total <= 0) return -1;

  return modules_published / modules_total;

}



export function sortClient360Clients(

  clients: TClient360Client[],

  { column, direction, mode: rawMode }: Client360SortState

): TClient360Client[] {

  const factor = direction === "asc" ? 1 : -1;

  const mode = normalizeClient360SortMode(rawMode);



  return [...clients].sort((a, b) => {

    let cmp = 0;



    switch (column) {

      case "name":

        if (mode === "identifier") {

          cmp = a.identifier.localeCompare(b.identifier, undefined, { sensitivity: "base" });

        } else {

          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

        }

        break;

      case "health":

        cmp = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];

        break;

      case "report":

        if (mode === "progress") {

          cmp = reportProgress(a) - reportProgress(b);

        } else {

          const ra = REPORT_ORDER[a.status_report.coverage] ?? 4;

          const rb = REPORT_ORDER[b.status_report.coverage] ?? 4;

          cmp = ra - rb || reportProgress(a) - reportProgress(b);

        }

        break;

      case "overdue":

        cmp = a.issues.overdue - b.issues.overdue;

        break;

      case "support":

        cmp = a.support.open_count - b.support.open_count;

        break;

      case "stakeholder":

        cmp = (a.responsible_stakeholder || "").localeCompare(b.responsible_stakeholder || "", undefined, {

          sensitivity: "base",

        });

        break;

      case "responsible": {

        const la = a.project_lead?.display_name || "";

        const lb = b.project_lead?.display_name || "";

        cmp = la.localeCompare(lb, undefined, { sensitivity: "base" });

        break;

      }

    }



    return cmp * factor || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

  });

}


