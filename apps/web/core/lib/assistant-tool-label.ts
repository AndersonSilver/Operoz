/** Maps assistant tool names to i18n keys under operoz_assistant.tools */
const TOOL_LABEL_KEYS: Record<string, string> = {
  search_issues: "search_issues",
  get_issue: "get_issue",
  get_client_360_summary: "get_client_360_summary",
  search_pages: "search_pages",
  search_documentation: "search_documentation",
  get_page_content: "get_page_content",
  get_automation_metrics: "get_automation_metrics",
  get_automation_run: "get_automation_run",
  list_intake_pending: "list_intake_pending",
  get_project_stats: "get_project_stats",
  list_board_projects: "list_board_projects",
  propose_automation_rule: "propose_automation_rule",
  explain_automation_run: "explain_automation_run",
  list_automation_packs: "list_automation_packs",
  propose_automation_pack_install: "propose_automation_pack_install",
  propose_issue_comment: "propose_issue_comment",
  propose_issue_state_change: "propose_issue_state_change",
};

export function assistantToolLabelKey(toolName: string): string | null {
  const key = TOOL_LABEL_KEYS[toolName];
  return key ? `operoz_assistant.tools.${key}` : null;
}

export const ASSISTANT_SESSIONS_CACHE_TTL_MS = 30_000;
