import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";

export const APP_INTEGRATION_OPERATIONS = [
  // Webhooks
  op("webhooks", "operoz_list_webhooks", "Lista webhooks", "app", "GET", `/workspaces/{${ws}}/webhooks/`, [ws]),
  op("webhooks", "operoz_create_webhook", "Cria webhook", "app", "POST", `/workspaces/{${ws}}/webhooks/`, [ws], {
    body: true,
  }),
  op("webhooks", "operoz_get_webhook", "Detalhe webhook", "app", "GET", `/workspaces/{${ws}}/webhooks/{pk}/`, [
    ws,
    "pk",
  ]),
  op(
    "webhooks",
    "operoz_update_webhook",
    "Atualiza webhook",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/webhooks/{pk}/`,
    [ws, "pk"],
    { body: true }
  ),
  op("webhooks", "operoz_delete_webhook", "Remove webhook", "app", "DELETE", `/workspaces/{${ws}}/webhooks/{pk}/`, [
    ws,
    "pk",
  ]),
  op(
    "webhooks",
    "operoz_regenerate_webhook",
    "Regenera secret",
    "app",
    "POST",
    `/workspaces/{${ws}}/webhooks/{pk}/regenerate/`,
    [ws, "pk"],
    { body: true }
  ),
  op(
    "webhooks",
    "operoz_list_webhook_logs",
    "Logs webhook",
    "app",
    "GET",
    `/workspaces/{${ws}}/webhook-logs/{webhook_id}/`,
    [ws, "webhook_id"]
  ),

  // Views
  op(
    "views",
    "operoz_list_project_views",
    "Views do projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/views/`,
    [ws, proj]
  ),
  op(
    "views",
    "operoz_create_project_view",
    "Cria view",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/views/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "views",
    "operoz_get_project_view",
    "Detalhe view",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/views/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "views",
    "operoz_update_project_view",
    "Atualiza view",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/views/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "views",
    "operoz_delete_project_view",
    "Remove view",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/views/{pk}/`,
    [ws, proj, "pk"]
  ),
  op("views", "operoz_list_workspace_views", "Views workspace", "app", "GET", `/workspaces/{${ws}}/views/`, [ws]),
  op(
    "views",
    "operoz_create_workspace_view",
    "Cria view workspace",
    "app",
    "POST",
    `/workspaces/{${ws}}/views/`,
    [ws],
    { body: true }
  ),
  op("views", "operoz_get_workspace_view", "Detalhe view workspace", "app", "GET", `/workspaces/{${ws}}/views/{pk}/`, [
    ws,
    "pk",
  ]),
  op(
    "views",
    "operoz_update_workspace_view",
    "Atualiza view workspace",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/views/{pk}/`,
    [ws, "pk"],
    { body: true }
  ),
  op(
    "views",
    "operoz_delete_workspace_view",
    "Remove view workspace",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/views/{pk}/`,
    [ws, "pk"]
  ),

  // Analytics
  op(
    "analytics",
    "operoz_get_workspace_analytics",
    "Analytics workspace",
    "app",
    "GET",
    `/workspaces/{${ws}}/analytics/`,
    [ws]
  ),
  op(
    "analytics",
    "operoz_list_analytic_views",
    "Vistas analíticas",
    "app",
    "GET",
    `/workspaces/{${ws}}/analytic-view/`,
    [ws]
  ),
  op(
    "analytics",
    "operoz_create_analytic_view",
    "Cria vista analítica",
    "app",
    "POST",
    `/workspaces/{${ws}}/analytic-view/`,
    [ws],
    { body: true }
  ),
  op(
    "analytics",
    "operoz_update_analytic_view",
    "Atualiza vista",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/analytic-view/{pk}/`,
    [ws, "pk"],
    { body: true }
  ),
  op(
    "analytics",
    "operoz_delete_analytic_view",
    "Remove vista",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/analytic-view/{pk}/`,
    [ws, "pk"]
  ),
  op(
    "analytics",
    "operoz_export_analytics",
    "Exporta analytics",
    "app",
    "POST",
    `/workspaces/{${ws}}/export-analytics/`,
    [ws],
    { body: true }
  ),
  op(
    "analytics",
    "operoz_get_default_analytics",
    "Analytics default",
    "app",
    "GET",
    `/workspaces/{${ws}}/default-analytics/`,
    [ws]
  ),
  op(
    "analytics",
    "operoz_get_project_stats",
    "Estatísticas projetos",
    "app",
    "GET",
    `/workspaces/{${ws}}/project-stats/`,
    [ws]
  ),
  op(
    "analytics",
    "operoz_get_advance_analytics",
    "Analytics avançado",
    "app",
    "GET",
    `/workspaces/{${ws}}/advance-analytics/`,
    [ws]
  ),
  op(
    "analytics",
    "operoz_get_project_advance_analytics",
    "Analytics avançado projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/advance-analytics/`,
    [ws, proj]
  ),

  // Search
  op("search", "operoz_search_workspace", "Pesquisa global workspace", "app", "GET", `/workspaces/{${ws}}/search/`, [
    ws,
  ]),
  op("search", "operoz_entity_search", "Pesquisa entidades", "app", "GET", `/workspaces/{${ws}}/entity-search/`, [ws]),

  // Notifications
  op(
    "notifications",
    "operoz_list_notifications",
    "Notificações",
    "app",
    "GET",
    `/workspaces/{${ws}}/users/notifications/`,
    [ws]
  ),
  op(
    "notifications",
    "operoz_get_notification",
    "Detalhe notificação",
    "app",
    "GET",
    `/workspaces/{${ws}}/users/notifications/{pk}/`,
    [ws, "pk"]
  ),
  op(
    "notifications",
    "operoz_mark_notification_read",
    "Marca lida",
    "app",
    "POST",
    `/workspaces/{${ws}}/users/notifications/{pk}/read/`,
    [ws, "pk"],
    {
      body: true,
    }
  ),
  op(
    "notifications",
    "operoz_mark_all_notifications_read",
    "Marca todas lidas",
    "app",
    "POST",
    `/workspaces/{${ws}}/users/notifications/mark-all-read/`,
    [ws],
    {
      body: true,
    }
  ),
  op(
    "notifications",
    "operoz_list_unread_notifications",
    "Não lidas",
    "app",
    "GET",
    `/workspaces/{${ws}}/users/notifications/unread/`,
    [ws]
  ),

  // Assets app
  op(
    "assets",
    "operoz_list_workspace_file_assets",
    "File assets workspace",
    "app",
    "GET",
    `/workspaces/{${ws}}/file-assets/`,
    [ws]
  ),
  op(
    "assets",
    "operoz_create_workspace_file_asset",
    "Upload file asset",
    "app",
    "POST",
    `/workspaces/{${ws}}/file-assets/`,
    [ws],
    { body: true }
  ),
  op("assets", "operoz_list_assets_v2", "Assets v2 workspace", "app", "GET", `/assets/v2/workspaces/{${ws}}/`, [ws]),
  op("assets", "operoz_create_asset_v2", "Cria asset v2", "app", "POST", `/assets/v2/workspaces/{${ws}}/`, [ws], {
    body: true,
  }),
  op("assets", "operoz_get_asset_v2", "Detalhe asset v2", "app", "GET", `/assets/v2/workspaces/{${ws}}/{asset_id}/`, [
    ws,
    "asset_id",
  ]),
  op(
    "assets",
    "operoz_update_asset_v2",
    "Atualiza asset v2",
    "app",
    "PATCH",
    `/assets/v2/workspaces/{${ws}}/{asset_id}/`,
    [ws, "asset_id"],
    {
      body: true,
    }
  ),
  op(
    "assets",
    "operoz_delete_asset_v2",
    "Remove asset v2",
    "app",
    "DELETE",
    `/assets/v2/workspaces/{${ws}}/{asset_id}/`,
    [ws, "asset_id"]
  ),
  op(
    "assets",
    "operoz_restore_asset_v2",
    "Restaura asset",
    "app",
    "POST",
    `/assets/v2/workspaces/{${ws}}/restore/{asset_id}/`,
    [ws, "asset_id"],
    {
      body: true,
    }
  ),
  op(
    "assets",
    "operoz_download_workspace_asset",
    "Download asset",
    "app",
    "GET",
    `/assets/v2/workspaces/{${ws}}/download/{asset_id}/`,
    [ws, "asset_id"]
  ),

  // Users app
  op("users", "operoz_get_me_app", "Perfil (app)", "app", "GET", "/users/me/", []),
  op("users", "operoz_update_me_app", "Atualiza perfil", "app", "PATCH", "/users/me/", [], { body: true }),
  op("users", "operoz_get_session", "Sessão", "app", "GET", "/users/session/", []),
  op("users", "operoz_get_me_settings", "Definições", "app", "GET", "/users/me/settings/", []),
  op("users", "operoz_get_me_profile", "Perfil detalhado", "app", "GET", "/users/me/profile/", []),
  op("users", "operoz_update_me_profile", "Atualiza perfil detalhado", "app", "PATCH", "/users/me/profile/", [], {
    body: true,
  }),
  op("users", "operoz_list_api_tokens", "API tokens", "app", "GET", "/users/api-tokens/", []),
  op("users", "operoz_create_api_token", "Cria API token", "app", "POST", "/users/api-tokens/", [], { body: true }),
  op("users", "operoz_delete_api_token", "Revoga token", "app", "DELETE", "/users/api-tokens/{pk}/", ["pk"]),
  op(
    "users",
    "operoz_get_me_dashboard",
    "Dashboard pessoal",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/dashboard/",
    ["workspace_slug"]
  ),
  op(
    "users",
    "operoz_get_notification_preferences",
    "Prefs notificações",
    "app",
    "GET",
    "/users/me/notification-preferences/",
    []
  ),
  op(
    "users",
    "operoz_update_notification_preferences",
    "Atualiza prefs",
    "app",
    "PATCH",
    "/users/me/notification-preferences/",
    [],
    { body: true }
  ),

  // AI / external
  op(
    "ai",
    "operoz_project_ai_assistant",
    "Assistente IA no projeto",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/ai-assistant/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "ai",
    "operoz_workspace_ai_assistant",
    "Assistente IA workspace",
    "app",
    "POST",
    `/workspaces/{${ws}}/ai-assistant/`,
    [ws],
    { body: true }
  ),

  // Jira ops
  op("jira", "operoz_get_jira_ops_sync", "Sync Jira Ops", "app", "GET", `/workspaces/{${ws}}/jira-ops-sync/`, [ws]),
  op(
    "jira",
    "operoz_update_jira_ops_sync",
    "Atualiza sync",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/jira-ops-sync/`,
    [ws],
    { body: true }
  ),
  op(
    "jira",
    "operoz_jira_oauth_start",
    "OAuth Jira start",
    "app",
    "GET",
    `/workspaces/{${ws}}/jira-ops-sync/oauth/start/`,
    [ws]
  ),
  op(
    "jira",
    "operoz_jira_preview_sync",
    "Preview sync Jira",
    "app",
    "POST",
    `/workspaces/{${ws}}/jira-ops-sync/preview/`,
    [ws],
    { body: true }
  ),

  // Misc
  op("misc", "operoz_list_timezones", "Fusos horários", "app", "GET", "/timezones/", []),
  op("misc", "operoz_list_stickies_app", "Stickies (app)", "app", "GET", `/workspaces/{${ws}}/stickies/`, [ws]),
  op("misc", "operoz_create_sticky_app", "Cria sticky (app)", "app", "POST", `/workspaces/{${ws}}/stickies/`, [ws], {
    body: true,
  }),
  op(
    "members",
    "operoz_list_project_members_app",
    "Membros projeto (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/members/`,
    [ws, proj]
  ),
  op(
    "members",
    "operoz_add_project_member_app",
    "Adiciona membro (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/members/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "members",
    "operoz_leave_project",
    "Sair do projeto",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/members/leave/`,
    [ws, proj],
    { body: true }
  ),
];
