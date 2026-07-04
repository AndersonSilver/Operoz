import { op } from "./types.js";

export const APP_PROJECT_OPERATIONS = [
  op(
    "projects",
    "operoz_archive_project_app",
    "Arquiva projeto (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/archive/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_create_project_app",
    "Cria projeto (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "projects",
    "operoz_create_project_deploy_board",
    "Cria deploy board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_create_project_status_report",
    "Cria status report",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_delete_project_app",
    "Remove projeto (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_delete_project_deploy_board",
    "Remove deploy board",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_delete_project_status_report",
    "Remove status report",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_deploy_board_retrieve_get",
    "Deploy Board — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_export_project_status_report",
    "Exporta status report",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/{pk}/export/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_get_project_app",
    "Detalhe projeto (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_get_project_custom_field_values",
    "Valores custom fields",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/custom-field-values/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_get_project_custom_fields",
    "Custom fields projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/custom-fields/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_get_project_form_layout",
    "Form layout",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/form-layout/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_get_project_issue_types",
    "Tipos de issue do projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/issue-types/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_get_project_status_report",
    "Detalhe status report",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_list_project_deploy_boards",
    "Deploy boards",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_list_project_identifiers",
    "Identificadores",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/project-identifiers/",
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_list_project_status_reports",
    "Status reports do projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_list_projects_app",
    "Lista projetos (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/",
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_list_projects_details",
    "Projetos com detalhes",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/details/",
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_preview_project_status_report",
    "Preview status report",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/{pk}/preview/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_board_permissions_get",
    "Project Board Permissions (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/board-permissions/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_project_favorites_create_post",
    "Project Favorites — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/user-favorite-projects/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_favorites_destroy_delete",
    "Project Favorites — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/user-favorite-projects/{project_id}/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_favorites_list_get",
    "Project Favorites — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/user-favorite-projects/",
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_project_identifier_delete",
    "Project Identifier (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/project-identifiers/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_create_post",
    "ProjectInvitationsViewset.create (POST)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/invitations/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_destroy_delete",
    "ProjectInvitationsViewset.destroy (DELETE)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/invitations/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_list_get",
    "ProjectInvitationsViewset.list (GET)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/invitations/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_project_invitations_viewset_retrieve_get",
    "ProjectInvitationsViewset.retrieve (GET)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/invitations/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_project_join_get",
    "Project Join (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/join/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_project_join_post",
    "Project Join (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/join/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_member_preference_get",
    "Project Member Preference (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/preferences/member/{member_id}/",
    ["workspace_slug","project_id","member_id"]
  ),
  op(
    "projects",
    "operoz_project_member_preference_patch",
    "Project Member Preference (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/preferences/member/{member_id}/",
    ["workspace_slug","project_id","member_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_member_retrieve_get",
    "Project Member — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/members/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "projects",
    "operoz_project_member_user_get",
    "Project Member User (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-members/me/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_project_update_put",
    "Project — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_project_user_views_post",
    "Project User Views (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-views/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_unarchive_project_app",
    "Desarquiva projeto (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/archive/",
    ["workspace_slug","project_id"]
  ),
  op(
    "projects",
    "operoz_update_project_app",
    "Atualiza projeto (app)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_update_project_custom_field_values",
    "Atualiza valores",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/custom-field-values/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "projects",
    "operoz_update_project_deploy_board",
    "Atualiza deploy board",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-deploy-boards/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_update_project_status_report",
    "Atualiza status report",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/status-reports/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "projects",
    "operoz_user_project_invitations_viewset_create_post",
    "UserProjectInvitationsViewset.create (POST)",
    "app",
    "POST",
    "/users/me/workspaces/{workspace_slug}/projects/invitations/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "projects",
    "operoz_user_project_invitations_viewset_list_get",
    "UserProjectInvitationsViewset.list (GET)",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/projects/invitations/",
    ["workspace_slug"]
  ),
  op(
    "projects",
    "operoz_user_project_roles_get",
    "User Project Roles (Consulta)",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/project-roles/",
    ["workspace_slug"]
  ),
];
