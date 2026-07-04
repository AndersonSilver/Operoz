import { op } from "./types.js";

export const APP_VIEW_OPERATIONS = [
  op(
    "views",
    "operoz_create_project_view",
    "Cria view",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "views",
    "operoz_create_workspace_view",
    "Cria view workspace",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/views/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "views",
    "operoz_delete_project_view",
    "Remove view",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "views",
    "operoz_delete_workspace_view",
    "Remove view workspace",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/views/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "views",
    "operoz_get_project_view",
    "Detalhe view",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "views",
    "operoz_get_workspace_view",
    "Detalhe view workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/views/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "views",
    "operoz_issue_view_favorite_create_post",
    "Issue View Favorite — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "views",
    "operoz_issue_view_favorite_destroy_delete",
    "Issue View Favorite — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/{view_id}/",
    ["workspace_slug","project_id","view_id"], { body: true }
  ),
  op(
    "views",
    "operoz_issue_view_favorite_list_get",
    "Issue View Favorite — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-views/",
    ["workspace_slug","project_id"]
  ),
  op(
    "views",
    "operoz_issue_view_update_put",
    "Issue View — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "views",
    "operoz_list_project_views",
    "Views do projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/",
    ["workspace_slug","project_id"]
  ),
  op(
    "views",
    "operoz_list_workspace_views",
    "Views workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/views/",
    ["workspace_slug"]
  ),
  op(
    "views",
    "operoz_update_project_view",
    "Atualiza view",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/views/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "views",
    "operoz_update_workspace_view",
    "Atualiza view workspace",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/views/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "views",
    "operoz_workspace_view_update_put",
    "Workspace View — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/views/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
];
