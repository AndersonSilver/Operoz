import { op } from "./types.js";

export const APP_BOARD_OPERATIONS = [
  op(
    "boards",
    "operoz_add_board_member",
    "Adiciona membro board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/members/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_archive_board",
    "Arquiva board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/archive/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_board_client_360_detail",
    "Cliente 360 detalhe",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/client-360/{project_id}/",
    ["workspace_slug","board_slug","project_id"]
  ),
  op(
    "boards",
    "operoz_board_client_360_list",
    "Cliente 360 lista",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/client-360/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_board_email_notification_audit_get",
    "Board Email Notification Audit (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/email-notification-logs/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_bulk_add_board_custom_fields",
    "Bulk add custom fields",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/custom-fields/bulk-add/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board",
    "Cria board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board_custom_field",
    "Cria custom field no board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/custom-fields/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board_issue_type",
    "Cria tipo de issue",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/issue-types/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board_project_field_layout",
    "Cria layout",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/project-field-layout/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board_role",
    "Cria role",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/roles/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_board_status_report",
    "Cria status report",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_create_workspace_custom_field",
    "Cria custom field",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/custom-fields/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_delete_board",
    "Remove board",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_delete_board_custom_field",
    "Remove custom field board",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/custom-fields/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_delete_board_issue_type",
    "Remove tipo",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/issue-types/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_delete_board_project_field_layout",
    "Remove layout",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/project-field-layout/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_delete_board_role",
    "Remove role",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/roles/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_delete_board_status_report",
    "Remove status report",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_delete_workspace_custom_field",
    "Remove custom field",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/custom-fields/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "boards",
    "operoz_duplicate_board_role",
    "Duplica role",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/roles/{pk}/duplicate/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_export_board_status_report",
    "Exporta status report",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/{pk}/export/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_get_board",
    "Detalhe board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_get_board_meta",
    "Meta do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/meta/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_get_board_permission_catalog",
    "Catálogo permissões",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/permission-catalog/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_get_board_project_form_layout",
    "Form layout projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/project-form-layout/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_get_board_status_report",
    "Detalhe status report",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/{pk}/",
    ["workspace_slug","board_slug","pk"]
  ),
  op(
    "boards",
    "operoz_list_board_custom_fields",
    "Custom fields do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/custom-fields/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_issue_types",
    "Tipos de issue do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/issue-types/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_issues",
    "Issues do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/issues/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_members",
    "Membros do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/members/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_modules",
    "Módulos no board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/modules/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_project_field_layout",
    "Layout campos projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/project-field-layout/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_roles",
    "Roles do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/roles/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_board_status_reports",
    "Status reports do board",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "boards",
    "operoz_list_boards",
    "Lista boards",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/",
    ["workspace_slug"]
  ),
  op(
    "boards",
    "operoz_list_workspace_custom_fields",
    "Custom fields workspace",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/custom-fields/",
    ["workspace_slug"]
  ),
  op(
    "boards",
    "operoz_remove_board_member",
    "Remove membro board",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/members/{user_id}/",
    ["workspace_slug","board_slug","user_id"]
  ),
  op(
    "boards",
    "operoz_unarchive_board",
    "Desarquiva board",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/unarchive/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board",
    "Atualiza board",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_custom_field",
    "Atualiza custom field board",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/custom-fields/{pk}/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_issue_type",
    "Atualiza tipo",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/issue-types/{pk}/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_member",
    "Atualiza membro board",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/members/{user_id}/",
    ["workspace_slug","board_slug","user_id"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_project_field_layout",
    "Atualiza layout",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/project-field-layout/{pk}/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_role",
    "Atualiza role",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/roles/{pk}/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_board_status_report",
    "Atualiza status report",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/status-reports/{pk}/",
    ["workspace_slug","board_slug","pk"], { body: true }
  ),
  op(
    "boards",
    "operoz_update_workspace_custom_field",
    "Atualiza custom field",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/custom-fields/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
];
