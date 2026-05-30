import { op } from "./types.js";

const ws = "workspace_slug";
const board = "board_slug";

export const APP_BOARD_OPERATIONS = [
  op("boards", "operis_list_boards", "Lista boards", "app", "GET", `/workspaces/{${ws}}/boards/`, [ws]),
  op("boards", "operis_get_board", "Detalhe board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/`, [ws, board]),
  op("boards", "operis_create_board", "Cria board", "app", "POST", `/workspaces/{${ws}}/boards/`, [ws], { body: true }),
  op("boards", "operis_update_board", "Atualiza board", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/`, [ws, board], { body: true }),
  op("boards", "operis_delete_board", "Remove board", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/`, [ws, board]),
  op("boards", "operis_archive_board", "Arquiva board", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/archive/`, [ws, board], { body: true }),
  op("boards", "operis_unarchive_board", "Desarquiva board", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/unarchive/`, [ws, board], { body: true }),
  op("boards", "operis_list_board_issues", "Issues do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/issues/`, [ws, board]),
  op("boards", "operis_get_board_meta", "Meta do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/meta/`, [ws, board]),
  op("boards", "operis_board_client_360_list", "Cliente 360 lista", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/client-360/`, [ws, board]),
  op("boards", "operis_board_client_360_detail", "Cliente 360 detalhe", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/client-360/{project_id}/`, [
    ws,
    board,
    "project_id",
  ]),
  op("boards", "operis_list_board_modules", "Módulos no board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/modules/`, [ws, board]),
  op("boards", "operis_list_board_issue_types", "Tipos de issue do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/issue-types/`, [ws, board]),
  op("boards", "operis_create_board_issue_type", "Cria tipo de issue", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/issue-types/`, [ws, board], {
    body: true,
  }),
  op("boards", "operis_update_board_issue_type", "Atualiza tipo", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/issue-types/{pk}/`, [ws, board, "pk"], {
    body: true,
  }),
  op("boards", "operis_delete_board_issue_type", "Remove tipo", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/issue-types/{pk}/`, [ws, board, "pk"]),
  op("boards", "operis_list_workspace_custom_fields", "Custom fields workspace", "app", "GET", `/workspaces/{${ws}}/custom-fields/`, [ws]),
  op("boards", "operis_create_workspace_custom_field", "Cria custom field", "app", "POST", `/workspaces/{${ws}}/custom-fields/`, [ws], { body: true }),
  op("boards", "operis_update_workspace_custom_field", "Atualiza custom field", "app", "PATCH", `/workspaces/{${ws}}/custom-fields/{pk}/`, [ws, "pk"], {
    body: true,
  }),
  op("boards", "operis_delete_workspace_custom_field", "Remove custom field", "app", "DELETE", `/workspaces/{${ws}}/custom-fields/{pk}/`, [ws, "pk"]),
  op("boards", "operis_list_board_custom_fields", "Custom fields do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/custom-fields/`, [ws, board]),
  op("boards", "operis_create_board_custom_field", "Cria custom field no board", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/custom-fields/`, [ws, board], {
    body: true,
  }),
  op("boards", "operis_bulk_add_board_custom_fields", "Bulk add custom fields", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/custom-fields/bulk-add/`, [ws, board], {
    body: true,
  }),
  op("boards", "operis_update_board_custom_field", "Atualiza custom field board", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/custom-fields/{pk}/`, [
    ws,
    board,
    "pk",
  ], { body: true }),
  op("boards", "operis_delete_board_custom_field", "Remove custom field board", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/custom-fields/{pk}/`, [
    ws,
    board,
    "pk",
  ]),
  op("boards", "operis_list_board_project_field_layout", "Layout campos projeto", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/project-field-layout/`, [ws, board]),
  op("boards", "operis_create_board_project_field_layout", "Cria layout", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/project-field-layout/`, [ws, board], {
    body: true,
  }),
  op("boards", "operis_update_board_project_field_layout", "Atualiza layout", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/project-field-layout/{pk}/`, [
    ws,
    board,
    "pk",
  ], { body: true }),
  op("boards", "operis_delete_board_project_field_layout", "Remove layout", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/project-field-layout/{pk}/`, [
    ws,
    board,
    "pk",
  ]),
  op("boards", "operis_get_board_project_form_layout", "Form layout projeto", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/project-form-layout/`, [ws, board]),
  op("boards", "operis_get_board_permission_catalog", "Catálogo permissões", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/permission-catalog/`, [ws, board]),
  op("boards", "operis_list_board_roles", "Roles do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/roles/`, [ws, board]),
  op("boards", "operis_create_board_role", "Cria role", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/roles/`, [ws, board], { body: true }),
  op("boards", "operis_update_board_role", "Atualiza role", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/roles/{pk}/`, [ws, board, "pk"], { body: true }),
  op("boards", "operis_delete_board_role", "Remove role", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/roles/{pk}/`, [ws, board, "pk"]),
  op("boards", "operis_duplicate_board_role", "Duplica role", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/roles/{pk}/duplicate/`, [ws, board, "pk"], {
    body: true,
  }),
  op("boards", "operis_list_board_members", "Membros do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/members/`, [ws, board]),
  op("boards", "operis_add_board_member", "Adiciona membro board", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/members/`, [ws, board], { body: true }),
  op("boards", "operis_update_board_member", "Atualiza membro board", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/members/{user_id}/`, [ws, board, "user_id"], {
    body: true,
  }),
  op("boards", "operis_remove_board_member", "Remove membro board", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/members/{user_id}/`, [ws, board, "user_id"]),
  op("boards", "operis_list_board_status_reports", "Status reports do board", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/status-reports/`, [ws, board]),
  op("boards", "operis_create_board_status_report", "Cria status report", "app", "POST", `/workspaces/{${ws}}/boards/{${board}}/status-reports/`, [ws, board], {
    body: true,
  }),
  op("boards", "operis_get_board_status_report", "Detalhe status report", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/status-reports/{pk}/`, [ws, board, "pk"]),
  op("boards", "operis_update_board_status_report", "Atualiza status report", "app", "PATCH", `/workspaces/{${ws}}/boards/{${board}}/status-reports/{pk}/`, [
    ws,
    board,
    "pk",
  ], { body: true }),
  op("boards", "operis_delete_board_status_report", "Remove status report", "app", "DELETE", `/workspaces/{${ws}}/boards/{${board}}/status-reports/{pk}/`, [
    ws,
    board,
    "pk",
  ]),
  op("boards", "operis_export_board_status_report", "Exporta status report", "app", "GET", `/workspaces/{${ws}}/boards/{${board}}/status-reports/{pk}/export/`, [
    ws,
    board,
    "pk",
  ]),
];
