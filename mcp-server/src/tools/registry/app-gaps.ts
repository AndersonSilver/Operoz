import { op } from "./types.js";

export const APP_GAP_OPERATIONS = [
  op(
    "analytics",
    "operoz_saved_analytic_get",
    "SavedAnalyticEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/saved-analytic-view/{analytic_id}/`,
    ["workspace_slug", "analytic_id"]
  ),
  op(
    "analytics",
    "operoz_advance_analytics_stats_get",
    "AdvanceAnalyticsStatsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/advance-analytics-stats/`,
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_advance_analytics_chart_get",
    "AdvanceAnalyticsChartEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/advance-analytics-charts/`,
    ["workspace_slug"]
  ),
  op(
    "analytics",
    "operoz_project_advance_analytics_stats_get",
    "ProjectAdvanceAnalyticsStatsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/advance-analytics-stats/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "analytics",
    "operoz_project_advance_analytics_chart_get",
    "ProjectAdvanceAnalyticsChartEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/advance-analytics-charts/`,
    ["workspace_slug", "project_id"]
  ),
  op("misc", "operoz_api_token_delete", "ApiTokenEndpoint (DELETE)", "app", "DELETE", `/users/api-tokens/`, [], {
    body: true,
  }),
  op("misc", "operoz_api_token_patch", "ApiTokenEndpoint (PATCH)", "app", "PATCH", `/users/api-tokens/`, [], {
    body: true,
  }),
  op("misc", "operoz_api_token_get", "ApiTokenEndpoint (GET)", "app", "GET", `/users/api-tokens/{pk}/`, ["pk"]),
  op(
    "misc",
    "operoz_api_token_patch_2",
    "ApiTokenEndpoint (PATCH)",
    "app",
    "PATCH",
    `/users/api-tokens/{pk}/`,
    ["pk"],
    { body: true }
  ),
  op("misc", "operoz_api_token_post", "ApiTokenEndpoint (POST)", "app", "POST", `/users/api-tokens/{pk}/`, ["pk"], {
    body: true,
  }),
  op(
    "assets",
    "operoz_file_asset_delete",
    "FileAssetEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/file-assets/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_delete_2",
    "FileAssetEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/file-assets/{workspace_id}/{asset_key}/`,
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_get",
    "FileAssetEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/file-assets/{workspace_id}/{asset_key}/`,
    ["workspace_id", "asset_key"]
  ),
  op(
    "assets",
    "operoz_file_asset_post",
    "FileAssetEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/file-assets/{workspace_id}/{asset_key}/`,
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op("assets", "operoz_user_assets_delete", "UserAssetsEndpoint (DELETE)", "app", "DELETE", `/users/file-assets/`, [], {
    body: true,
  }),
  op("assets", "operoz_user_assets_get", "UserAssetsEndpoint (GET)", "app", "GET", `/users/file-assets/`, []),
  op("assets", "operoz_user_assets_post", "UserAssetsEndpoint (POST)", "app", "POST", `/users/file-assets/`, [], {
    body: true,
  }),
  op(
    "assets",
    "operoz_user_assets_delete_2",
    "UserAssetsEndpoint (DELETE)",
    "app",
    "DELETE",
    `/users/file-assets/{asset_key}/`,
    ["asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_get_2",
    "UserAssetsEndpoint (GET)",
    "app",
    "GET",
    `/users/file-assets/{asset_key}/`,
    ["asset_key"]
  ),
  op(
    "assets",
    "operoz_user_assets_post_2",
    "UserAssetsEndpoint (POST)",
    "app",
    "POST",
    `/users/file-assets/{asset_key}/`,
    ["asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_delete",
    "WorkspaceFileAssetEndpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{workspace_slug}/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_patch",
    "WorkspaceFileAssetEndpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{workspace_slug}/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_post",
    "WorkspaceFileAssetEndpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/{asset_id}/`,
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_delete",
    "UserAssetsV2Endpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/user-assets/`,
    [],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_patch",
    "UserAssetsV2Endpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/user-assets/`,
    [],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_post",
    "UserAssetsV2Endpoint (POST)",
    "app",
    "POST",
    `/assets/v2/user-assets/`,
    [],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_delete_2",
    "UserAssetsV2Endpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/user-assets/{asset_id}/`,
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_patch_2",
    "UserAssetsV2Endpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/user-assets/{asset_id}/`,
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_post_2",
    "UserAssetsV2Endpoint (POST)",
    "app",
    "POST",
    `/assets/v2/user-assets/{asset_id}/`,
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_static_file_asset_get",
    "StaticFileAssetEndpoint (GET)",
    "app",
    "GET",
    `/assets/v2/static/{asset_id}/`,
    ["asset_id"]
  ),
  op(
    "assets",
    "operoz_project_asset_delete",
    "ProjectAssetEndpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_get",
    "ProjectAssetEndpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "assets",
    "operoz_project_asset_patch",
    "ProjectAssetEndpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_post",
    "ProjectAssetEndpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_delete_2",
    "ProjectAssetEndpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_get_2",
    "ProjectAssetEndpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "assets",
    "operoz_project_asset_patch_2",
    "ProjectAssetEndpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_post_2",
    "ProjectAssetEndpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_bulk_asset_post",
    "ProjectBulkAssetEndpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{entity_id}/bulk/`,
    ["workspace_slug", "project_id", "entity_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_asset_check_get",
    "AssetCheckEndpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/check/{asset_id}/`,
    ["workspace_slug", "asset_id"]
  ),
  op(
    "assets",
    "operoz_duplicate_asset_post",
    "DuplicateAssetEndpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/duplicate-assets/{asset_id}/`,
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_download_get",
    "ProjectAssetDownloadEndpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/download/{asset_id}/`,
    ["workspace_slug", "project_id", "asset_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_ops_metrics_get",
    "AssistantOpsMetricsEndpoint (GET)",
    "app",
    "GET",
    `/assistant/ops/metrics/`,
    []
  ),
  op(
    "assistant",
    "operoz_assistant_session_list_create_get",
    "AssistantSessionListCreateEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/sessions/`,
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_session_list_create_post",
    "AssistantSessionListCreateEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/assistant/sessions/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_delete",
    "AssistantSessionDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/`,
    ["workspace_slug", "session_id"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_get",
    "AssistantSessionDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/`,
    ["workspace_slug", "session_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_session_detail_patch",
    "AssistantSessionDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/`,
    ["workspace_slug", "session_id"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_session_messages_get",
    "AssistantSessionMessagesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/messages/`,
    ["workspace_slug", "session_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_session_chat_post",
    "AssistantSessionChatEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/chat/`,
    ["workspace_slug", "session_id"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_chat_job_stream_get",
    "AssistantChatJobStreamEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/chat/jobs/{job_id}/stream/`,
    ["workspace_slug", "job_id"]
  ),
  op(
    "assistant",
    "operoz_assistant_message_feedback_patch",
    "AssistantMessageFeedbackEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/messages/{message_id}/feedback/`,
    ["workspace_slug", "session_id", "message_id"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_confirm_action_post",
    "AssistantConfirmActionEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/assistant/sessions/{session_id}/confirm-action/`,
    ["workspace_slug", "session_id"],
    { body: true }
  ),
  op(
    "assistant",
    "operoz_assistant_usage_get",
    "AssistantUsageEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/usage/`,
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_quality_get",
    "AssistantQualityEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/quality/`,
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_quality_review_get",
    "AssistantQualityReviewEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/assistant/quality/reviews/`,
    ["workspace_slug"]
  ),
  op(
    "assistant",
    "operoz_assistant_quality_review_post",
    "AssistantQualityReviewEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/assistant/quality/reviews/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "boards",
    "operoz_board_email_notification_audit_get",
    "BoardEmailNotificationAuditEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/email-notification-logs/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_catalog_get",
    "BoardAutomationCatalogEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/catalog/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_list_get",
    "BoardAutomationRuleListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_list_post",
    "BoardAutomationRuleListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_delete",
    "BoardAutomationRuleDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/`,
    ["workspace_slug", "board_slug", "rule_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_get",
    "BoardAutomationRuleDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/`,
    ["workspace_slug", "board_slug", "rule_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_patch",
    "BoardAutomationRuleDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/`,
    ["workspace_slug", "board_slug", "rule_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_publish_post",
    "BoardAutomationRulePublishEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/publish/`,
    ["workspace_slug", "board_slug", "rule_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_revision_list_get",
    "BoardAutomationRuleRevisionListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/revisions/`,
    ["workspace_slug", "board_slug", "rule_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_revision_restore_post",
    "BoardAutomationRuleRevisionRestoreEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/revisions/{revision_id}/restore/`,
    ["workspace_slug", "board_slug", "rule_id", "revision_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_validate_post",
    "BoardAutomationValidateEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/validate/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_dry_run_post",
    "BoardAutomationDryRunEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/dry-run/`,
    ["workspace_slug", "board_slug", "rule_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_run_list_get",
    "BoardAutomationRunListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/runs/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_metrics_get",
    "BoardAutomationMetricsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/metrics/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_dead_letter_list_get",
    "BoardAutomationDeadLetterListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/dead-letters/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_policy_get",
    "BoardAutomationPolicyEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/policy/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_policy_patch",
    "BoardAutomationPolicyEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/policy/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_publish_audit_list_get",
    "BoardAutomationPublishAuditListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/publish-audits/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_hook_list_get",
    "BoardAutomationHookListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_hook_list_post",
    "BoardAutomationHookListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_hook_detail_delete",
    "BoardAutomationHookDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/{hook_id}/`,
    ["workspace_slug", "board_slug", "hook_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_hook_detail_patch",
    "BoardAutomationHookDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/{hook_id}/`,
    ["workspace_slug", "board_slug", "hook_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_pack_list_get",
    "BoardAutomationPackListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_pack_install_post",
    "BoardAutomationPackInstallEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/{pack_name}/install/`,
    ["workspace_slug", "board_slug", "pack_name"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_pack_uninstall_post",
    "BoardAutomationPackUninstallEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/{pack_name}/uninstall/`,
    ["workspace_slug", "board_slug", "pack_name"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_template_list_get",
    "BoardAutomationTemplateListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/templates/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_template_install_post",
    "BoardAutomationTemplateInstallEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/templates/{template_id}/install/`,
    ["workspace_slug", "board_slug", "template_id"],
    { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_list_get",
    "BoardPlaybookListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "playbooks",
    "operoz_board_playbook_list_post",
    "BoardPlaybookListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_detail_delete",
    "BoardPlaybookDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/`,
    ["workspace_slug", "board_slug", "playbook_id"],
    { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_detail_get",
    "BoardPlaybookDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/`,
    ["workspace_slug", "board_slug", "playbook_id"]
  ),
  op(
    "playbooks",
    "operoz_board_playbook_detail_patch",
    "BoardPlaybookDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/`,
    ["workspace_slug", "board_slug", "playbook_id"],
    { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_publish_post",
    "BoardPlaybookPublishEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/publish/`,
    ["workspace_slug", "board_slug", "playbook_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_list_get",
    "BoardAutomationSecretListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_secret_list_post",
    "BoardAutomationSecretListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_detail_delete",
    "BoardAutomationSecretDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/{secret_id}/`,
    ["workspace_slug", "board_slug", "secret_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_detail_patch",
    "BoardAutomationSecretDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/{secret_id}/`,
    ["workspace_slug", "board_slug", "secret_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_script_list_get",
    "BoardAutomationScriptListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_script_list_post",
    "BoardAutomationScriptListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_delete",
    "BoardAutomationScriptDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/`,
    ["workspace_slug", "board_slug", "script_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_get",
    "BoardAutomationScriptDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/`,
    ["workspace_slug", "board_slug", "script_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_patch",
    "BoardAutomationScriptDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/`,
    ["workspace_slug", "board_slug", "script_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_list_get",
    "BoardAutomationEmailTemplateListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/`,
    ["workspace_slug", "board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_list_post",
    "BoardAutomationEmailTemplateListEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/`,
    ["workspace_slug", "board_slug"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_delete",
    "BoardAutomationEmailTemplateDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/`,
    ["workspace_slug", "board_slug", "template_id"],
    { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_get",
    "BoardAutomationEmailTemplateDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/`,
    ["workspace_slug", "board_slug", "template_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_patch",
    "BoardAutomationEmailTemplateDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/`,
    ["workspace_slug", "board_slug", "template_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_user_properties_get",
    "CycleUserPropertiesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/user-properties/`,
    ["workspace_slug", "project_id", "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_user_properties_patch",
    "CycleUserPropertiesEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/user-properties/`,
    ["workspace_slug", "project_id", "cycle_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete",
    "CycleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/archive/`,
    ["workspace_slug", "project_id", "cycle_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_get",
    "CycleArchiveUnarchiveEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/archive/`,
    ["workspace_slug", "project_id", "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete_2",
    "CycleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_post",
    "CycleArchiveUnarchiveEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete_3",
    "CycleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_get_2",
    "CycleArchiveUnarchiveEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_post_2",
    "CycleArchiveUnarchiveEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_export_issues_get",
    "ExportIssuesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/export-issues/`,
    ["workspace_slug"]
  ),
  op("misc", "operoz_unsplash_get", "UnsplashEndpoint (GET)", "app", "GET", `/unsplash/`, []),
  op(
    "intake",
    "operoz_intake_work_item_description_version_get",
    "IntakeWorkItemDescriptionVersionEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/`,
    ["workspace_slug", "project_id", "work_item_id"]
  ),
  op(
    "intake",
    "operoz_intake_work_item_description_version_get_2",
    "IntakeWorkItemDescriptionVersionEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/{pk}/`,
    ["workspace_slug", "project_id", "work_item_id", "pk"]
  ),
  op(
    "intake",
    "operoz_intake_form_list_create_get",
    "IntakeFormListCreateEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "intake",
    "operoz_intake_form_list_create_post",
    "IntakeFormListCreateEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "intake",
    "operoz_intake_form_detail_delete",
    "IntakeFormDetailEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/`,
    ["workspace_slug", "project_id", "form_id"],
    { body: true }
  ),
  op(
    "intake",
    "operoz_intake_form_detail_get",
    "IntakeFormDetailEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/`,
    ["workspace_slug", "project_id", "form_id"]
  ),
  op(
    "intake",
    "operoz_intake_form_detail_patch",
    "IntakeFormDetailEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/`,
    ["workspace_slug", "project_id", "form_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_list_get",
    "IssueListEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/list/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_delete",
    "IssueAttachmentEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_get",
    "IssueAttachmentEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_post",
    "IssueAttachmentEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_delete_2",
    "IssueAttachmentEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_get_2",
    "IssueAttachmentEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_post_2",
    "IssueAttachmentEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_delete",
    "IssueAttachmentV2Endpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_get",
    "IssueAttachmentV2Endpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_patch",
    "IssueAttachmentV2Endpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_post",
    "IssueAttachmentV2Endpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_delete_2",
    "IssueAttachmentV2Endpoint (DELETE)",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_get_2",
    "IssueAttachmentV2Endpoint (GET)",
    "app",
    "GET",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_patch_2",
    "IssueAttachmentV2Endpoint (PATCH)",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_attachment_v2_post_2",
    "IssueAttachmentV2Endpoint (POST)",
    "app",
    "POST",
    `/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/attachments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_project_user_display_property_get",
    "ProjectUserDisplayPropertyEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-properties/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "work_items",
    "operoz_project_user_display_property_patch",
    "ProjectUserDisplayPropertyEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-properties/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_bulk_update_date_post",
    "IssueBulkUpdateDateEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issue-dates/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_version_get",
    "IssueVersionEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/versions/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_work_item_description_version_get",
    "WorkItemDescriptionVersionEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/description-versions/`,
    ["workspace_slug", "project_id", "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_work_item_description_version_get_2",
    "WorkItemDescriptionVersionEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/work-items/{work_item_id}/description-versions/{pk}/`,
    ["workspace_slug", "project_id", "work_item_id", "pk"]
  ),
  op(
    "jira",
    "operoz_jira_ops_oauth_callback_get",
    "JiraOpsOAuthCallbackEndpoint (GET)",
    "app",
    "GET",
    `/jira-ops/oauth/callback/`,
    []
  ),
  op(
    "modules",
    "operoz_module_user_properties_get",
    "ModuleUserPropertiesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/user-properties/`,
    ["workspace_slug", "project_id", "module_id"]
  ),
  op(
    "modules",
    "operoz_module_user_properties_patch",
    "ModuleUserPropertiesEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/user-properties/`,
    ["workspace_slug", "project_id", "module_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete",
    "ModuleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/archive/`,
    ["workspace_slug", "project_id", "module_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_get",
    "ModuleArchiveUnarchiveEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/archive/`,
    ["workspace_slug", "project_id", "module_id"]
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete_2",
    "ModuleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_post",
    "ModuleArchiveUnarchiveEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete_3",
    "ModuleArchiveUnarchiveEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_get_2",
    "ModuleArchiveUnarchiveEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_post_2",
    "ModuleArchiveUnarchiveEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "pages",
    "operoz_assistant_page_index_status_get",
    "AssistantPageIndexStatusEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/pages/{page_id}/assistant-index-status/`,
    ["workspace_slug", "project_id", "page_id"]
  ),
  op(
    "projects",
    "operoz_project_identifier_delete",
    "ProjectIdentifierEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/project-identifiers/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_user_project_roles_get",
    "UserProjectRolesEndpoint (GET)",
    "app",
    "GET",
    `/users/me/workspaces/{workspace_slug}/project-roles/`,
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_project_join_get",
    "ProjectJoinEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/join/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "projects",
    "operoz_project_join_post",
    "ProjectJoinEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/join/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_user_views_post",
    "ProjectUserViewsEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/project-views/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_member_user_get",
    "ProjectMemberUserEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/project-members/me/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "projects",
    "operoz_project_member_preference_get",
    "ProjectMemberPreferenceEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/preferences/member/{member_id}/`,
    ["workspace_slug", "project_id", "member_id"]
  ),
  op(
    "projects",
    "operoz_project_member_preference_patch",
    "ProjectMemberPreferenceEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/preferences/member/{member_id}/`,
    ["workspace_slug", "project_id", "member_id"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_board_permissions_get",
    "ProjectBoardPermissionsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/board-permissions/`,
    ["workspace_slug", "project_id"]
  ),
  op("users", "operoz_account_delete", "AccountEndpoint (DELETE)", "app", "DELETE", `/users/me/accounts/`, [], {
    body: true,
  }),
  op("users", "operoz_account_get", "AccountEndpoint (GET)", "app", "GET", `/users/me/accounts/`, []),
  op(
    "users",
    "operoz_account_delete_2",
    "AccountEndpoint (DELETE)",
    "app",
    "DELETE",
    `/users/me/accounts/{pk}/`,
    ["pk"],
    { body: true }
  ),
  op("users", "operoz_account_get_2", "AccountEndpoint (GET)", "app", "GET", `/users/me/accounts/{pk}/`, ["pk"]),
  op(
    "users",
    "operoz_update_user_on_boarded_patch",
    "UpdateUserOnBoardedEndpoint (PATCH)",
    "app",
    "PATCH",
    `/users/me/onboard/`,
    [],
    { body: true }
  ),
  op(
    "users",
    "operoz_update_user_tour_completed_patch",
    "UpdateUserTourCompletedEndpoint (PATCH)",
    "app",
    "PATCH",
    `/users/me/tour-completed/`,
    [],
    { body: true }
  ),
  op("users", "operoz_user_activity_get", "UserActivityEndpoint (GET)", "app", "GET", `/users/me/activities/`, []),
  op(
    "users",
    "operoz_user_activity_graph_get",
    "UserActivityGraphEndpoint (GET)",
    "app",
    "GET",
    `/users/me/workspaces/{workspace_slug}/activity-graph/`,
    ["workspace_slug"]
  ),
  op(
    "users",
    "operoz_user_issue_completed_graph_get",
    "UserIssueCompletedGraphEndpoint (GET)",
    "app",
    "GET",
    `/users/me/workspaces/{workspace_slug}/issues-completed-graph/`,
    ["workspace_slug"]
  ),
  op(
    "webhooks",
    "operoz_webhook_delete",
    "WebhookEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/webhooks/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "webhooks",
    "operoz_webhook_patch",
    "WebhookEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/webhooks/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "webhooks",
    "operoz_webhook_post",
    "WebhookEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/webhooks/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_transfer_ownership_post",
    "WorkspaceTransferOwnershipEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/transfer-ownership/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_join_get",
    "WorkspaceJoinEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/invitations/{pk}/join/`,
    ["workspace_slug", "pk"]
  ),
  op(
    "workspaces",
    "operoz_user_last_project_with_workspace_get",
    "UserLastProjectWithWorkspaceEndpoint (GET)",
    "app",
    "GET",
    `/users/last-visited-workspace/`,
    []
  ),
  op(
    "workspaces",
    "operoz_workspace_member_user_get",
    "WorkspaceMemberUserEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/workspace-members/me/`,
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_member_user_views_post",
    "WorkspaceMemberUserViewsEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/workspace-views/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_stats_get",
    "WorkspaceUserProfileStatsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-stats/{user_id}/`,
    ["workspace_slug", "user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_activity_get",
    "WorkspaceUserActivityEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-activity/{user_id}/`,
    ["workspace_slug", "user_id"]
  ),
  op(
    "workspaces",
    "operoz_export_workspace_user_activity_post",
    "ExportWorkspaceUserActivityEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/user-activity/{user_id}/export/`,
    ["workspace_slug", "user_id"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_get",
    "WorkspaceUserProfileEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-profile/{user_id}/`,
    ["workspace_slug", "user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_profile_issues_get",
    "WorkspaceUserProfileIssuesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-issues/{user_id}/`,
    ["workspace_slug", "user_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_properties_get",
    "WorkspaceUserPropertiesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-properties/`,
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_user_properties_patch",
    "WorkspaceUserPropertiesEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/user-properties/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_delete",
    "WorkspaceFavoriteEndpoint (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/user-favorites/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_patch",
    "WorkspaceFavoriteEndpoint (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/user-favorites/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_get",
    "WorkspaceFavoriteEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-favorites/{favorite_id}/`,
    ["workspace_slug", "favorite_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_post",
    "WorkspaceFavoriteEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/user-favorites/{favorite_id}/`,
    ["workspace_slug", "favorite_id"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_favorite_group_get",
    "WorkspaceFavoriteGroupEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-favorites/{favorite_id}/group/`,
    ["workspace_slug", "favorite_id"]
  ),
  op(
    "workspaces",
    "operoz_workspace_home_preference_view_set_get",
    "WorkspaceHomePreferenceViewSet (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/home-preferences/{key}/`,
    ["workspace_slug", "key"]
  ),
  op(
    "workspaces",
    "operoz_workspace_home_preference_view_set_patch",
    "WorkspaceHomePreferenceViewSet (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/home-preferences/{key}/`,
    ["workspace_slug", "key"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_sync_post",
    "WorkspaceJiraOpsSyncEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/jira-ops-sync/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_oauth_sites_get",
    "WorkspaceJiraOpsOAuthSitesEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/jira-ops-sync/oauth/sites/`,
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_oauth_complete_post",
    "WorkspaceJiraOpsOAuthCompleteEndpoint (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/jira-ops-sync/oauth/complete/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_jira_ops_jira_projects_get",
    "WorkspaceJiraOpsJiraProjectsEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/jira-ops-sync/jira-projects/`,
    ["workspace_slug"]
  ),

  op(
    "analytics",
    "operoz_analytic_view_viewset_retrieve_get",
    "AnalyticViewViewset.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/analytic-view/{pk}/`,
    ["workspace_slug", "pk"]
  ),
  op(
    "assets",
    "operoz_file_asset_restore_post",
    "FileAssetViewSet.restore (POST)",
    "app",
    "POST",
    `/workspaces/file-assets/{workspace_id}/{asset_key}/restore/`,
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_retrieve_get",
    "CycleViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "cycles",
    "operoz_cycle_update_put",
    "CycleViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_issue_retrieve_get",
    "CycleIssueViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/`,
    ["workspace_slug", "project_id", "cycle_id", "issue_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_issue_update_put",
    "CycleIssueViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/`,
    ["workspace_slug", "project_id", "cycle_id", "issue_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_issue_partial_update_patch",
    "CycleIssueViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/`,
    ["workspace_slug", "project_id", "cycle_id", "issue_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_list_get",
    "CycleFavoriteViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_create_post",
    "CycleFavoriteViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_destroy_delete",
    "CycleFavoriteViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/{cycle_id}/`,
    ["workspace_slug", "project_id", "cycle_id"],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_bulk_estimate_point_retrieve_get",
    "BulkEstimatePointEndpoint.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/estimates/{estimate_id}/`,
    ["workspace_slug", "project_id", "estimate_id"]
  ),
  op(
    "intake",
    "operoz_intake_retrieve_get",
    "IntakeViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/intakes/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "intake",
    "operoz_intake_destroy_delete",
    "IntakeViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/intakes/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "intake",
    "operoz_intake_retrieve_get_2",
    "IntakeViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/inboxes/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "intake",
    "operoz_intake_destroy_delete_2",
    "IntakeViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/inboxes/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "intake",
    "operoz_intake_issue_retrieve_get",
    "IntakeIssueViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "intake",
    "operoz_intake_issue_destroy_delete",
    "IntakeIssueViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_update_put",
    "IssueViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_label_retrieve_get",
    "LabelViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_label_update_put",
    "LabelViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_label_partial_update_patch",
    "LabelViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_label_destroy_delete",
    "LabelViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issue-labels/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_link_retrieve_get",
    "IssueLinkViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_link_update_put",
    "IssueLinkViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-links/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_comment_retrieve_get",
    "IssueCommentViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_comment_update_put",
    "IssueCommentViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/comments/{pk}/`,
    ["workspace_slug", "project_id", "issue_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_list_get",
    "IssueSubscriberViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_create_post",
    "IssueSubscriberViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_destroy_delete",
    "IssueSubscriberViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-subscribers/{subscriber_id}/`,
    ["workspace_slug", "project_id", "issue_id", "subscriber_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_subscription_status_get",
    "IssueSubscriberViewSet.subscription_status (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_subscribe_post",
    "IssueSubscriberViewSet.subscribe (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_subscriber_unsubscribe_delete",
    "IssueSubscriberViewSet.unsubscribe (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/subscribe/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_reaction_list_get",
    "IssueReactionViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_reaction_create_post",
    "IssueReactionViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_reaction_destroy_delete",
    "IssueReactionViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/reactions/{reaction_code}/`,
    ["workspace_slug", "project_id", "issue_id", "reaction_code"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_comment_reaction_list_get",
    "CommentReactionViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/`,
    ["workspace_slug", "project_id", "comment_id"]
  ),
  op(
    "work_items",
    "operoz_comment_reaction_create_post",
    "CommentReactionViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/`,
    ["workspace_slug", "project_id", "comment_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_comment_reaction_destroy_delete",
    "CommentReactionViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/comments/{comment_id}/reactions/{reaction_code}/`,
    ["workspace_slug", "project_id", "comment_id", "reaction_code"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_archive_retrieve_get",
    "IssueArchiveViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{pk}/archive/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_issue_relation_list_get",
    "IssueRelationViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-relation/`,
    ["workspace_slug", "project_id", "issue_id"]
  ),
  op(
    "work_items",
    "operoz_issue_relation_create_post",
    "IssueRelationViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/issue-relation/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_relation_remove_relation_post",
    "IssueRelationViewSet.remove_relation (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/remove-relation/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_issue_detail_identifier_get",
    "IssueDetailIdentifierEndpoint (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/work-items/<str:project_identifier>-<str:issue_identifier>/`,
    ["workspace_slug"]
  ),
  op(
    "modules",
    "operoz_module_retrieve_get",
    "ModuleViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "modules",
    "operoz_module_update_put",
    "ModuleViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_create_issue_modules_post",
    "ModuleIssueViewSet.create_issue_modules (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/modules/`,
    ["workspace_slug", "project_id", "issue_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_retrieve_get",
    "ModuleIssueViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/`,
    ["workspace_slug", "project_id", "module_id", "issue_id"]
  ),
  op(
    "modules",
    "operoz_module_issue_update_put",
    "ModuleIssueViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/`,
    ["workspace_slug", "project_id", "module_id", "issue_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_partial_update_patch",
    "ModuleIssueViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/`,
    ["workspace_slug", "project_id", "module_id", "issue_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_destroy_delete",
    "ModuleIssueViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/`,
    ["workspace_slug", "project_id", "module_id", "issue_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_retrieve_get",
    "ModuleLinkViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/`,
    ["workspace_slug", "project_id", "module_id", "pk"]
  ),
  op(
    "modules",
    "operoz_module_link_update_put",
    "ModuleLinkViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/`,
    ["workspace_slug", "project_id", "module_id", "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_partial_update_patch",
    "ModuleLinkViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/`,
    ["workspace_slug", "project_id", "module_id", "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_destroy_delete",
    "ModuleLinkViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/`,
    ["workspace_slug", "project_id", "module_id", "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_favorite_list_get",
    "ModuleFavoriteViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "modules",
    "operoz_module_favorite_create_post",
    "ModuleFavoriteViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_module_favorite_destroy_delete",
    "ModuleFavoriteViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/{module_id}/`,
    ["workspace_slug", "project_id", "module_id"],
    { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_partial_update_patch",
    "NotificationViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/users/notifications/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_destroy_delete",
    "NotificationViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/users/notifications/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_mark_unread_delete",
    "NotificationViewSet.mark_unread (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/users/notifications/{pk}/read/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_archive_post",
    "NotificationViewSet.archive (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/users/notifications/{pk}/archive/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_unarchive_delete",
    "NotificationViewSet.unarchive (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/users/notifications/{pk}/archive/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_update_put",
    "ProjectViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_list_get",
    "ProjectInvitationsViewset.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/invitations/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_create_post",
    "ProjectInvitationsViewset.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/invitations/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_retrieve_get",
    "ProjectInvitationsViewset.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/invitations/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_destroy_delete",
    "ProjectInvitationsViewset.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/invitations/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_user_project_invitations_viewset_list_get",
    "UserProjectInvitationsViewset.list (GET)",
    "app",
    "GET",
    `/users/me/workspaces/{workspace_slug}/projects/invitations/`,
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_user_project_invitations_viewset_create_post",
    "UserProjectInvitationsViewset.create (POST)",
    "app",
    "POST",
    `/users/me/workspaces/{workspace_slug}/projects/invitations/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_member_retrieve_get",
    "ProjectMemberViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/members/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "projects",
    "operoz_project_favorites_list_get",
    "ProjectFavoritesViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/user-favorite-projects/`,
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_project_favorites_create_post",
    "ProjectFavoritesViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/user-favorite-projects/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_project_favorites_destroy_delete",
    "ProjectFavoritesViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/user-favorite-projects/{project_id}/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_deploy_board_retrieve_get",
    "DeployBoardViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "states",
    "operoz_state_retrieve_get",
    "StateViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/states/{pk}/`,
    ["workspace_slug", "project_id", "pk"]
  ),
  op("users", "operoz_user_deactivate_delete", "UserEndpoint.deactivate (DELETE)", "app", "DELETE", `/users/me/`, [], {
    body: true,
  }),
  op(
    "users",
    "operoz_user_generate_email_verification_code_post",
    "UserEndpoint.generate_email_verification_code (POST)",
    "app",
    "POST",
    `/users/me/email/generate-code/`,
    [],
    { body: true }
  ),
  op(
    "users",
    "operoz_user_update_email_patch",
    "UserEndpoint.update_email (PATCH)",
    "app",
    "PATCH",
    `/users/me/email/`,
    [],
    { body: true }
  ),
  op(
    "users",
    "operoz_user_retrieve_instance_admin_get",
    "UserEndpoint.retrieve_instance_admin (GET)",
    "app",
    "GET",
    `/users/me/instance-admin/`,
    []
  ),
  op(
    "views",
    "operoz_issue_view_update_put",
    "IssueViewViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/projects/{project_id}/views/{pk}/`,
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "views",
    "operoz_workspace_view_update_put",
    "WorkspaceViewViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/views/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "views",
    "operoz_issue_view_favorite_list_get",
    "IssueViewFavoriteViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/`,
    ["workspace_slug", "project_id"]
  ),
  op(
    "views",
    "operoz_issue_view_favorite_create_post",
    "IssueViewFavoriteViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/`,
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "views",
    "operoz_issue_view_favorite_destroy_delete",
    "IssueViewFavoriteViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/{view_id}/`,
    ["workspace_slug", "project_id", "view_id"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_work_space_update_put",
    "WorkSpaceViewSet.update (PUT)",
    "app",
    "PUT",
    `/workspaces/{workspace_slug}/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_user_workspace_invitations_create_post",
    "UserWorkspaceInvitationsViewSet.create (POST)",
    "app",
    "POST",
    `/users/me/workspaces/invitations/`,
    [],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_list_get",
    "WorkspaceThemeViewSet.list (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/workspace-themes/`,
    ["workspace_slug"]
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_create_post",
    "WorkspaceThemeViewSet.create (POST)",
    "app",
    "POST",
    `/workspaces/{workspace_slug}/workspace-themes/`,
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_retrieve_get",
    "WorkspaceThemeViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/workspace-themes/{pk}/`,
    ["workspace_slug", "pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_partial_update_patch",
    "WorkspaceThemeViewSet.partial_update (PATCH)",
    "app",
    "PATCH",
    `/workspaces/{workspace_slug}/workspace-themes/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_theme_destroy_delete",
    "WorkspaceThemeViewSet.destroy (DELETE)",
    "app",
    "DELETE",
    `/workspaces/{workspace_slug}/workspace-themes/{pk}/`,
    ["workspace_slug", "pk"],
    { body: true }
  ),
  op(
    "workspaces",
    "operoz_workspace_draft_issue_retrieve_get",
    "WorkspaceDraftIssueViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/draft-issues/{pk}/`,
    ["workspace_slug", "pk"]
  ),
  op(
    "workspaces",
    "operoz_quick_link_retrieve_get",
    "QuickLinkViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/quick-links/{pk}/`,
    ["workspace_slug", "pk"]
  ),
  op(
    "workspaces",
    "operoz_workspace_sticky_retrieve_get",
    "WorkspaceStickyViewSet.retrieve (GET)",
    "app",
    "GET",
    `/workspaces/{workspace_slug}/stickies/{pk}/`,
    ["workspace_slug", "pk"]
  ),
];
