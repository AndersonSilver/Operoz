import { op } from "./types.js";

export const APP_INTEGRATION_OPERATIONS = [
  op(
    "misc",
    "operoz_api_token_delete",
    "Api Token (Remove)",
    "app",
    "DELETE",
    "/users/api-tokens/",
    [], { body: true }
  ),
  op(
    "misc",
    "operoz_api_token_get",
    "Api Token (Consulta)",
    "app",
    "GET",
    "/users/api-tokens/{pk}/",
    ["pk"]
  ),
  op(
    "misc",
    "operoz_api_token_patch",
    "Api Token (Atualiza)",
    "app",
    "PATCH",
    "/users/api-tokens/",
    [], { body: true }
  ),
  op(
    "misc",
    "operoz_api_token_patch_2",
    "Api Token (Atualiza)",
    "app",
    "PATCH",
    "/users/api-tokens/{pk}/",
    ["pk"], { body: true }
  ),
  op(
    "misc",
    "operoz_api_token_post",
    "Api Token (Executa)",
    "app",
    "POST",
    "/users/api-tokens/{pk}/",
    ["pk"], { body: true }
  ),
  op(
    "misc",
    "operoz_create_sticky_app",
    "Cria sticky (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/stickies/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_create_webhook",
    "Cria webhook",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/webhooks/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_delete_webhook",
    "Remove webhook",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/webhooks/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "search",
    "operoz_entity_search",
    "Pesquisa entidades",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/entity-search/",
    ["workspace_slug"]
  ),
  op(
    "jira",
    "operoz_get_jira_ops_sync",
    "Sync Jira Ops",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/jira-ops-sync/",
    ["workspace_slug"]
  ),
  op(
    "webhooks",
    "operoz_get_webhook",
    "Detalhe webhook",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/webhooks/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "jira",
    "operoz_jira_oauth_start",
    "OAuth Jira start",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/jira-ops-sync/oauth/start/",
    ["workspace_slug"]
  ),
  op(
    "jira",
    "operoz_jira_ops_oauth_callback_get",
    "Jira Ops OAuth Callback (Consulta)",
    "app",
    "GET",
    "/jira-ops/oauth/callback/",
    []
  ),
  op(
    "jira",
    "operoz_jira_preview_sync",
    "Preview sync Jira",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/jira-ops-sync/preview/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "misc",
    "operoz_list_stickies_app",
    "Stickies (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/stickies/",
    ["workspace_slug"]
  ),
  op(
    "misc",
    "operoz_list_timezones",
    "Fusos horários",
    "app",
    "GET",
    "/timezones/",
    []
  ),
  op(
    "webhooks",
    "operoz_list_webhook_logs",
    "Logs webhook",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/webhook-logs/{webhook_id}/",
    ["workspace_slug","webhook_id"]
  ),
  op(
    "webhooks",
    "operoz_list_webhooks",
    "Lista webhooks",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/webhooks/",
    ["workspace_slug"]
  ),
  op(
    "ai",
    "operoz_project_ai_assistant",
    "Assistente IA no projeto",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/ai-assistant/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_regenerate_webhook",
    "Regenera secret",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/webhooks/{pk}/regenerate/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "search",
    "operoz_search_workspace",
    "Pesquisa global workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/search/",
    ["workspace_slug"]
  ),
  op(
    "misc",
    "operoz_unsplash_get",
    "Unsplash (Consulta)",
    "app",
    "GET",
    "/unsplash/",
    []
  ),
  op(
    "jira",
    "operoz_update_jira_ops_sync",
    "Atualiza sync",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/jira-ops-sync/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_update_webhook",
    "Atualiza webhook",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/webhooks/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_webhook_delete",
    "Webhook (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/webhooks/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_webhook_patch",
    "Webhook (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/webhooks/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "webhooks",
    "operoz_webhook_post",
    "Webhook (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/webhooks/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "ai",
    "operoz_workspace_ai_assistant",
    "Assistente IA workspace",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/ai-assistant/",
    ["workspace_slug"], { body: true }
  ),
];
