import type { TAlertRule } from "@operoz/types";

export type AlertRulesFilters = {
  query: string;
  status: "all" | "enabled" | "disabled";
};

export const DEFAULT_ALERT_RULES_FILTERS: AlertRulesFilters = {
  query: "",
  status: "all",
};

export function hasActiveAlertRulesFilters(filters: AlertRulesFilters): boolean {
  return filters.query.trim().length > 0 || filters.status !== "all";
}

export function filterAlertRules(
  rules: TAlertRule[],
  filters: AlertRulesFilters,
  labelForType: (type: string) => string
): TAlertRule[] {
  const query = filters.query.trim().toLowerCase();

  return rules.filter((rule) => {
    if (filters.status === "enabled" && !rule.enabled) return false;
    if (filters.status === "disabled" && rule.enabled) return false;

    if (!query) return true;

    const name = (rule.name || labelForType(rule.alert_type)).toLowerCase();
    const typeLabel = labelForType(rule.alert_type).toLowerCase();
    return name.includes(query) || typeLabel.includes(query);
  });
}
