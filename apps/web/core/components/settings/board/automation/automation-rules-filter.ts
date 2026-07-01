import type { IBoardAutomationRule } from "@operoz/types";
import { automationGraphForDisplay } from "./automation-publication";
import { summarizeAutomationGraph } from "./automation-utils";

export type AutomationRulesStatusFilter = "all" | "active" | "inactive";
export type AutomationRulesSort = "updated_desc" | "updated_asc" | "name_asc" | "name_desc";

export type AutomationRulesFilterState = {
  search: string;
  status: AutomationRulesStatusFilter;
  triggerKey: string;
  sort: AutomationRulesSort;
};

export function getRuleTriggerKey(rule: IBoardAutomationRule): string | null {
  const graph = automationGraphForDisplay(rule);
  const trigger = graph?.nodes?.find((n) => n.data.kind === "trigger");
  return trigger?.data.catalog_key ?? null;
}

export function collectRuleTriggerOptions(rules: IBoardAutomationRule[]) {
  const map = new Map<string, string>();
  for (const rule of rules) {
    const graph = automationGraphForDisplay(rule);
    const key = getRuleTriggerKey(rule);
    const label = summarizeAutomationGraph(graph).triggerLabel;
    if (key && label) map.set(key, label);
  }
  return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
}

export function filterAndSortAutomationRules(
  rules: IBoardAutomationRule[],
  filters: AutomationRulesFilterState
): IBoardAutomationRule[] {
  const q = filters.search.trim().toLowerCase();
  let result = rules.filter((rule) => {
    const graph = automationGraphForDisplay(rule);
    const summary = summarizeAutomationGraph(graph);
    const triggerKey = getRuleTriggerKey(rule);

    if (filters.status === "active" && !rule.enabled) return false;
    if (filters.status === "inactive" && rule.enabled) return false;
    if (filters.triggerKey !== "all" && triggerKey !== filters.triggerKey) return false;

    if (!q) return true;
    return (
      rule.name.toLowerCase().includes(q) ||
      (rule.description ?? "").toLowerCase().includes(q) ||
      (summary.triggerLabel ?? "").toLowerCase().includes(q)
    );
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "name_asc":
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      case "name_desc":
        return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
      case "updated_asc":
        return (a.updated_at ?? "").localeCompare(b.updated_at ?? "");
      case "updated_desc":
      default:
        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
    }
  });

  return result;
}

export function hasActiveAutomationRulesFilters(filters: AutomationRulesFilterState): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.triggerKey !== "all" ||
    filters.sort !== "updated_desc"
  );
}
