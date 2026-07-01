import type { IBoardAutomationRule, TAutomationPublicationStatus } from "@operoz/types";

export function automationGraphForDisplay(rule: IBoardAutomationRule) {
  if (rule.is_published && rule.published_graph?.nodes?.length) {
    return rule.published_graph;
  }
  return rule.graph;
}

export function automationHasLocalDraftChanges(
  rule: IBoardAutomationRule,
  draft: { name: string; description: string; graph: IBoardAutomationRule["graph"] }
): boolean {
  return (
    rule.name !== draft.name ||
    (rule.description ?? "") !== draft.description ||
    JSON.stringify(rule.graph ?? {}) !== JSON.stringify(draft.graph ?? {})
  );
}

export type AutomationPublicationBadge = {
  labelKey: string;
  tone: "neutral" | "warning" | "success" | "accent";
};

export function automationPublicationBadge(
  rule: IBoardAutomationRule,
  options?: { includeLive?: boolean }
): AutomationPublicationBadge {
  const includeLive = options?.includeLive ?? true;

  if (!rule.is_published) {
    return { labelKey: "boards.settings.automation.rules_list.status_draft", tone: "warning" };
  }

  if (rule.has_unpublished_changes) {
    return { labelKey: "boards.settings.automation.rules_list.status_pending", tone: "warning" };
  }

  if (includeLive && rule.enabled) {
    return { labelKey: "boards.settings.automation.rules_list.status_live", tone: "success" };
  }

  if (rule.enabled) {
    return { labelKey: "boards.settings.automation.rules_list.status_active", tone: "success" };
  }

  return { labelKey: "boards.settings.automation.editor.published_badge", tone: "neutral" };
}

export function automationPublicationStatusLabel(status: TAutomationPublicationStatus): AutomationPublicationBadge {
  switch (status) {
    case "draft_only":
      return { labelKey: "boards.settings.automation.editor.draft_only_badge", tone: "warning" };
    case "published_with_drafts":
      return { labelKey: "boards.settings.automation.editor.pending_publish_badge", tone: "warning" };
    default:
      return { labelKey: "boards.settings.automation.editor.published_badge", tone: "success" };
  }
}
