import { op } from "./types.js";

export const APP_ASSET_OPERATIONS = [
  op(
    "assets",
    "operoz_asset_check_get",
    "Asset Check (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/check/{asset_id}/",
    ["workspace_slug", "asset_id"]
  ),
  op(
    "assets",
    "operoz_create_asset_v2",
    "Cria asset v2",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/",
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_create_workspace_file_asset",
    "Upload file asset",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/file-assets/",
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_delete_asset_v2",
    "Remove asset v2",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/{asset_id}/",
    ["workspace_slug", "asset_id"]
  ),
  op(
    "assets",
    "operoz_download_workspace_asset",
    "Baixa o conteúdo de um asset como anexo (content-disposition=attachment), incluindo HTML embutido em páginas/PRDs. Funciona para qualquer entity_type.",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/download/{asset_id}/",
    ["workspace_slug", "asset_id"]
  ),
  op(
    "assets",
    "operoz_duplicate_asset_post",
    "Duplicate Asset (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/duplicate-assets/{asset_id}/",
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_delete",
    "File Asset (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/file-assets/",
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_delete_2",
    "File Asset (Remove)",
    "app",
    "DELETE",
    "/workspaces/file-assets/{workspace_id}/{asset_key}/",
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_get",
    "File Asset (Consulta)",
    "app",
    "GET",
    "/workspaces/file-assets/{workspace_id}/{asset_key}/",
    ["workspace_id", "asset_key"]
  ),
  op(
    "assets",
    "operoz_file_asset_post",
    "File Asset (Executa)",
    "app",
    "POST",
    "/workspaces/file-assets/{workspace_id}/{asset_key}/",
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_file_asset_restore_post",
    "File Asset — restore (Executa)",
    "app",
    "POST",
    "/workspaces/file-assets/{workspace_id}/{asset_key}/restore/",
    ["workspace_id", "asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_get_asset_v2",
    "Baixa o conteúdo de um asset do workspace (imagem, PDF, HTML embutido em página/PRD etc.). Use esta operação para obter o conteúdo real do arquivo; funciona para qualquer entity_type, incluindo assets de página (ex: htmlDocumentEmbed).",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/{asset_id}/",
    ["workspace_slug", "asset_id"]
  ),
  op(
    "assets",
    "operoz_list_assets_v2",
    "Assets v2 workspace",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/",
    ["workspace_slug"]
  ),
  op(
    "assets",
    "operoz_list_workspace_file_assets",
    "File assets workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/file-assets/",
    ["workspace_slug"]
  ),
  op(
    "assets",
    "operoz_project_asset_delete",
    "Project Asset (Remove)",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_delete_2",
    "Project Asset (Remove)",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_download_get",
    "Project Asset Download (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/download/{asset_id}/",
    ["workspace_slug", "project_id", "asset_id"]
  ),
  op(
    "assets",
    "operoz_project_asset_get",
    "Project Asset (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug", "project_id"]
  ),
  op(
    "assets",
    "operoz_project_asset_get_2",
    "Project Asset (Consulta)",
    "app",
    "GET",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/",
    ["workspace_slug", "project_id", "pk"]
  ),
  op(
    "assets",
    "operoz_project_asset_patch",
    "Project Asset (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_patch_2",
    "Project Asset (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_post",
    "Project Asset (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug", "project_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_asset_post_2",
    "Project Asset (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{pk}/",
    ["workspace_slug", "project_id", "pk"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_project_bulk_asset_post",
    "Project Bulk Asset (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/projects/{project_id}/{entity_id}/bulk/",
    ["workspace_slug", "project_id", "entity_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_restore_asset_v2",
    "Restaura asset",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/restore/{asset_id}/",
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_static_file_asset_get",
    "Static File Asset (Consulta). Só aceita entity_type USER_AVATAR/USER_COVER/WORKSPACE_LOGO/PROJECT_COVER (retorna 400 para outros, incluindo assets de página/PRD). Para baixar HTML embutido em página, use operoz_get_asset_v2 ou operoz_download_workspace_asset.",
    "app",
    "GET",
    "/assets/v2/static/{asset_id}/",
    ["asset_id"]
  ),
  op(
    "assets",
    "operoz_update_asset_v2",
    "Atualiza asset v2",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/{asset_id}/",
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
  op("assets", "operoz_user_assets_delete", "User Assets (Remove)", "app", "DELETE", "/users/file-assets/", [], {
    body: true,
  }),
  op(
    "assets",
    "operoz_user_assets_delete_2",
    "User Assets (Remove)",
    "app",
    "DELETE",
    "/users/file-assets/{asset_key}/",
    ["asset_key"],
    { body: true }
  ),
  op("assets", "operoz_user_assets_get", "User Assets (Consulta)", "app", "GET", "/users/file-assets/", []),
  op("assets", "operoz_user_assets_get_2", "User Assets (Consulta)", "app", "GET", "/users/file-assets/{asset_key}/", [
    "asset_key",
  ]),
  op("assets", "operoz_user_assets_post", "User Assets (Executa)", "app", "POST", "/users/file-assets/", [], {
    body: true,
  }),
  op(
    "assets",
    "operoz_user_assets_post_2",
    "User Assets (Executa)",
    "app",
    "POST",
    "/users/file-assets/{asset_key}/",
    ["asset_key"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_delete",
    "User Assets V2 (Remove)",
    "app",
    "DELETE",
    "/assets/v2/user-assets/",
    [],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_delete_2",
    "User Assets V2 (Remove)",
    "app",
    "DELETE",
    "/assets/v2/user-assets/{asset_id}/",
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_patch",
    "User Assets V2 (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/user-assets/",
    [],
    { body: true }
  ),
  op(
    "assets",
    "operoz_user_assets_v2_patch_2",
    "User Assets V2 (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/user-assets/{asset_id}/",
    ["asset_id"],
    { body: true }
  ),
  op("assets", "operoz_user_assets_v2_post", "User Assets V2 (Executa)", "app", "POST", "/assets/v2/user-assets/", [], {
    body: true,
  }),
  op(
    "assets",
    "operoz_user_assets_v2_post_2",
    "User Assets V2 (Executa)",
    "app",
    "POST",
    "/assets/v2/user-assets/{asset_id}/",
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_delete",
    "Workspace File Asset (Remove)",
    "app",
    "DELETE",
    "/assets/v2/workspaces/{workspace_slug}/",
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_patch",
    "Workspace File Asset (Atualiza)",
    "app",
    "PATCH",
    "/assets/v2/workspaces/{workspace_slug}/",
    ["workspace_slug"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_workspace_file_asset_post",
    "Workspace File Asset (Executa)",
    "app",
    "POST",
    "/assets/v2/workspaces/{workspace_slug}/{asset_id}/",
    ["workspace_slug", "asset_id"],
    { body: true }
  ),
];
