import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";
const issue = "issue_id";
const pk = "pk";

export const APP_WORK_ITEM_OPERATIONS = [
  op("work_items", "operis_list_issues_app", "Lista issues (app)", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/`, [ws, proj]),
  op("work_items", "operis_list_issues_detail", "Issues detalhadas", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues-detail/`, [ws, proj]),
  op("work_items", "operis_list_issues_v2", "Issues v2", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/v2/issues/`, [ws, proj]),
  op("work_items", "operis_get_issue_app", "Detalhe issue (app)", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${pk}}/`, [ws, proj, pk]),
  op("work_items", "operis_create_issue_app", "Cria issue (app)", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issues/`, [ws, proj], { body: true }),
  op("work_items", "operis_update_issue_app", "Atualiza issue (app)", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${pk}}/`, [ws, proj, pk], {
    body: true,
  }),
  op("work_items", "operis_delete_issue_app", "Remove issue (app)", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${pk}}/`, [ws, proj, pk]),
  op("work_items", "operis_get_issue_by_identifier_app", "Issue por identificador", "app", "GET", `/workspaces/{${ws}}/work-items/{project_identifier}-{issue_identifier}/`, [
    ws,
    "project_identifier",
    "issue_identifier",
  ]),
  op("work_items", "operis_search_workspace_issues", "Pesquisa issues workspace", "app", "GET", `/workspaces/{${ws}}/issues/`, [ws]),
  op("work_items", "operis_search_project_issues", "Pesquisa issues projeto", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/search-issues/`, [ws, proj]),
  op("work_items", "operis_bulk_delete_issues", "Apaga issues em massa", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/bulk-delete-issues/`, [ws, proj], {
    body: true,
  }),
  op("work_items", "operis_bulk_archive_issues", "Arquiva issues em massa", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/bulk-archive-issues/`, [ws, proj], {
    body: true,
  }),
  op("work_items", "operis_list_archived_issues", "Issues arquivadas", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/archived-issues/`, [ws, proj]),
  op("work_items", "operis_list_deleted_issues", "Issues apagadas", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/deleted-issues/`, [ws, proj]),
  op("work_items", "operis_archive_issue", "Arquiva issue", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${pk}}/archive/`, [ws, proj, pk], {
    body: true,
  }),
  op("work_items", "operis_unarchive_issue", "Desarquiva issue", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${pk}}/archive/`, [ws, proj, pk]),
  op("work_items", "operis_get_issue_meta", "Meta da issue", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/meta/`, [ws, proj, issue]),
  op("work_items", "operis_list_sub_issues", "Sub-issues", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/sub-issues/`, [ws, proj, issue]),
  op("work_items", "operis_create_sub_issue", "Cria sub-issue", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/sub-issues/`, [ws, proj, issue], {
    body: true,
  }),
  op("work_items", "operis_list_issue_links_app", "Links da issue", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/issue-links/`, [ws, proj, issue]),
  op("work_items", "operis_create_issue_link_app", "Cria link", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/issue-links/`, [ws, proj, issue], {
    body: true,
  }),
  op("work_items", "operis_update_issue_link_app", "Atualiza link", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/issue-links/{${pk}}/`, [
    ws,
    proj,
    issue,
    pk,
  ], { body: true }),
  op("work_items", "operis_delete_issue_link_app", "Remove link", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/issue-links/{${pk}}/`, [
    ws,
    proj,
    issue,
    pk,
  ]),
  op("work_items", "operis_list_issue_comments_app", "Comentários (app)", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/comments/`, [ws, proj, issue]),
  op("work_items", "operis_create_issue_comment_app", "Comenta (app)", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/comments/`, [ws, proj, issue], {
    body: true,
  }),
  op("work_items", "operis_update_issue_comment_app", "Edita comentário", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/comments/{${pk}}/`, [
    ws,
    proj,
    issue,
    pk,
  ], { body: true }),
  op("work_items", "operis_delete_issue_comment_app", "Remove comentário", "app", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/comments/{${pk}}/`, [
    ws,
    proj,
    issue,
    pk,
  ]),
  op("work_items", "operis_get_issue_history", "Histórico", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/history/`, [ws, proj, issue]),
  op("work_items", "operis_list_issue_versions", "Versões", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issues/{${issue}}/versions/`, [ws, proj, issue]),
  op("work_items", "operis_list_issue_labels_app", "Labels issue", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/issue-labels/`, [ws, proj]),
  op("work_items", "operis_create_issue_label_app", "Cria label", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/issue-labels/`, [ws, proj], { body: true }),
  op("work_items", "operis_bulk_create_labels", "Cria labels em massa", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/bulk-create-labels/`, [ws, proj], {
    body: true,
  }),
  op("work_items", "operis_list_intake_issues_app", "Intake issues (app)", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/`, [ws, proj]),
  op("work_items", "operis_create_intake_issue_app", "Cria intake", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/`, [ws, proj], { body: true }),
  op("work_items", "operis_update_intake_issue_app", "Atualiza intake", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{${pk}}/`, [ws, proj, pk], {
    body: true,
  }),
  op("work_items", "operis_list_inbox_issues", "Inbox issues", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/inbox-issues/`, [ws, proj]),
  op("work_items", "operis_create_inbox_issue", "Cria inbox issue", "app", "POST", `/workspaces/{${ws}}/projects/{${proj}}/inbox-issues/`, [ws, proj], { body: true }),
  op("work_items", "operis_update_inbox_issue", "Atualiza inbox", "app", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/inbox-issues/{${pk}}/`, [ws, proj, pk], {
    body: true,
  }),
  op("work_items", "operis_get_issue_custom_fields", "Custom fields da issue", "app", "GET", `/workspaces/{${ws}}/issues/{${issue}}/custom-fields/`, [ws, issue]),
  op("work_items", "operis_update_issue_custom_fields", "Atualiza custom fields", "app", "PUT", `/workspaces/{${ws}}/issues/{${issue}}/custom-fields/`, [ws, issue], {
    body: true,
  }),
];
