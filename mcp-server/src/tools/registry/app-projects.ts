import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";

export const APP_PROJECT_OPERATIONS = [
  op("projects", "operoz_list_projects_app", "Lista projetos (app)", "app", "GET", `/workspaces/{${ws}}/projects/`, [
    ws,
  ]),
  op(
    "projects",
    "operoz_list_projects_details",
    "Projetos com detalhes",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/details/`,
    [ws]
  ),
  op(
    "projects",
    "operoz_get_project_app",
    "Detalhe projeto (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_create_project_app",
    "Cria projeto (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/`,
    [ws],
    { body: true }
  ),
  op(
    "projects",
    "operoz_update_project_app",
    "Atualiza projeto (app)",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_delete_project_app",
    "Remove projeto (app)",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_get_project_issue_types",
    "Tipos de issue do projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/issue-types/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_get_project_custom_fields",
    "Custom fields projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/custom-fields/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_get_project_form_layout",
    "Form layout",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/form-layout/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_get_project_custom_field_values",
    "Valores custom fields",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/custom-field-values/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_update_project_custom_field_values",
    "Atualiza valores",
    "app",
    "PUT",
    `/workspaces/{${ws}}/projects/{${proj}}/custom-field-values/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_list_project_identifiers",
    "Identificadores",
    "app",
    "GET",
    `/workspaces/{${ws}}/project-identifiers/`,
    [ws]
  ),
  op(
    "projects",
    "operoz_archive_project_app",
    "Arquiva projeto (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/archive/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_unarchive_project_app",
    "Desarquiva projeto (app)",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/archive/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_list_project_status_reports",
    "Status reports do projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_create_project_status_report",
    "Cria status report",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_get_project_status_report",
    "Detalhe status report",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "projects",
    "operoz_update_project_status_report",
    "Atualiza status report",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_delete_project_status_report",
    "Remove status report",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "projects",
    "operoz_export_project_status_report",
    "Exporta status report",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/{pk}/export/`,
    [ws, proj, "pk"]
  ),
  op(
    "projects",
    "operoz_preview_project_status_report",
    "Preview status report",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/status-reports/{pk}/preview/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_list_project_deploy_boards",
    "Deploy boards",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/project-deploy-boards/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_create_project_deploy_board",
    "Cria deploy board",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/project-deploy-boards/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_update_project_deploy_board",
    "Atualiza deploy board",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/project-deploy-boards/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "projects",
    "operoz_delete_project_deploy_board",
    "Remove deploy board",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/project-deploy-boards/{pk}/`,
    [ws, proj, "pk"]
  ),
];
