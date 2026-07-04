import { op } from "./types.js";

export const APP_MODULE_OPERATIONS = [
  op(
    "modules",
    "operoz_add_module_issue_app",
    "Adiciona issue ao módulo",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/",
    ["workspace_slug","project_id","module_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_create_module_app",
    "Cria módulo (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_create_module_link",
    "Cria link módulo",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/",
    ["workspace_slug","project_id","module_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_delete_module_app",
    "Remove módulo (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "modules",
    "operoz_list_module_issues_app",
    "Issues no módulo (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/",
    ["workspace_slug","project_id","module_id"]
  ),
  op(
    "modules",
    "operoz_list_module_links",
    "Links do módulo",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/",
    ["workspace_slug","project_id","module_id"]
  ),
  op(
    "modules",
    "operoz_list_modules_app",
    "Módulos (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/",
    ["workspace_slug","project_id"]
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete",
    "Module Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/archive/",
    ["workspace_slug","project_id","module_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete_2",
    "Module Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_delete_3",
    "Module Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_get",
    "Module Archive Unarchive (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/archive/",
    ["workspace_slug","project_id","module_id"]
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_get_2",
    "Module Archive Unarchive (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_post",
    "Module Archive Unarchive (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_archive_unarchive_post_2",
    "Module Archive Unarchive (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-modules/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_favorite_create_post",
    "Module Favorite — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_favorite_destroy_delete",
    "Module Favorite — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/{module_id}/",
    ["workspace_slug","project_id","module_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_favorite_list_get",
    "Module Favorite — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-modules/",
    ["workspace_slug","project_id"]
  ),
  op(
    "modules",
    "operoz_module_issue_create_issue_modules_post",
    "Module Issue — create issue modules (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/issues/{issue_id}/modules/",
    ["workspace_slug","project_id","issue_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_destroy_delete",
    "Module Issue — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/",
    ["workspace_slug","project_id","module_id","issue_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_partial_update_patch",
    "Module Issue — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/",
    ["workspace_slug","project_id","module_id","issue_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_issue_retrieve_get",
    "Module Issue — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/",
    ["workspace_slug","project_id","module_id","issue_id"]
  ),
  op(
    "modules",
    "operoz_module_issue_update_put",
    "Module Issue — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/issues/{issue_id}/",
    ["workspace_slug","project_id","module_id","issue_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_destroy_delete",
    "Module Link — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/",
    ["workspace_slug","project_id","module_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_partial_update_patch",
    "Module Link — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/",
    ["workspace_slug","project_id","module_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_link_retrieve_get",
    "Module Link — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/",
    ["workspace_slug","project_id","module_id","pk"]
  ),
  op(
    "modules",
    "operoz_module_link_update_put",
    "Module Link — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/module-links/{pk}/",
    ["workspace_slug","project_id","module_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_retrieve_get",
    "Module — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "modules",
    "operoz_module_update_put",
    "Module — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "modules",
    "operoz_module_user_properties_get",
    "Module User Properties (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/user-properties/",
    ["workspace_slug","project_id","module_id"]
  ),
  op(
    "modules",
    "operoz_module_user_properties_patch",
    "Module User Properties (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{module_id}/user-properties/",
    ["workspace_slug","project_id","module_id"], { body: true }
  ),
  op(
    "modules",
    "operoz_update_module_app",
    "Atualiza módulo (app)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/modules/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
];
