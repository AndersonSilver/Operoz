import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";

export const V1_OPERATIONS = [
  // Projects
  op("projects", "operis_list_projects", "Lista projetos", "v1", "GET", `/workspaces/{${ws}}/projects/`, [ws]),
  op("projects", "operis_get_project", "Detalhe projeto", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/`, [ws, proj]),
  op("projects", "operis_create_project", "Cria projeto", "v1", "POST", `/workspaces/{${ws}}/projects/`, [ws], { body: true }),
  op("projects", "operis_update_project", "Atualiza projeto", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/`, [ws, proj], {
    body: true,
  }),
  op("projects", "operis_delete_project", "Remove projeto", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/`, [ws, proj]),
  op("projects", "operis_archive_project", "Arquiva projeto", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/archive/`, [ws, proj], {
    body: true,
  }),
  op("projects", "operis_unarchive_project", "Desarquiva projeto", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/archive/`, [ws, proj]),
  op("projects", "operis_get_project_summary", "Resumo do projeto", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/summary/`, [ws, proj]),

  // Work items
  op("work_items", "operis_search_work_items", "Pesquisa work items", "v1", "GET", `/workspaces/{${ws}}/work-items/search/`, [ws]),
  op(
    "work_items",
    "operis_get_work_item_by_identifier",
    "Work item por identificador PROJ-123",
    "v1",
    "GET",
    `/workspaces/{${ws}}/work-items/{project_identifier}-{issue_identifier}/`,
    [ws, "project_identifier", "issue_identifier"],
  ),
  op("work_items", "operis_list_work_items", "Lista work items", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/`, [ws, proj]),
  op("work_items", "operis_get_work_item", "Detalhe work item", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_create_work_item", "Cria work item", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/work-items/`, [ws, proj], {
    body: true,
  }),
  op("work_items", "operis_update_work_item", "Atualiza work item", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`, [
    ws,
    proj,
    "work_item_id",
  ], { body: true }),
  op("work_items", "operis_delete_work_item", "Remove work item", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_list_work_item_links", "Links do work item", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_create_work_item_link", "Cria link", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/`, [
    ws,
    proj,
    "work_item_id",
  ], { body: true }),
  op("work_items", "operis_update_work_item_link", "Atualiza link", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ], { body: true }),
  op("work_items", "operis_delete_work_item_link", "Remove link", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ]),
  op("work_items", "operis_list_work_item_comments", "Comentários", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_create_work_item_comment", "Adiciona comentário", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/`, [
    ws,
    proj,
    "work_item_id",
  ], { body: true }),
  op("work_items", "operis_update_work_item_comment", "Edita comentário", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ], { body: true }),
  op("work_items", "operis_delete_work_item_comment", "Remove comentário", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ]),
  op("work_items", "operis_list_work_item_activities", "Atividades", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/activities/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_list_work_item_attachments", "Anexos", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_create_work_item_attachment", "Adiciona anexo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/`, [
    ws,
    proj,
    "work_item_id",
  ], { body: true }),
  op("work_items", "operis_update_work_item_attachment", "Atualiza anexo", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ], { body: true }),
  op("work_items", "operis_delete_work_item_attachment", "Remove anexo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/{pk}/`, [
    ws,
    proj,
    "work_item_id",
    "pk",
  ]),
  op("work_items", "operis_list_work_item_relations", "Relações entre items", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/relations/`, [
    ws,
    proj,
    "work_item_id",
  ]),
  op("work_items", "operis_create_work_item_relation", "Cria relação", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/relations/`, [
    ws,
    proj,
    "work_item_id",
  ], { body: true }),

  // States & labels
  op("states", "operis_list_states", "Estados do projeto", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/states/`, [ws, proj]),
  op("states", "operis_create_state", "Cria estado", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/states/`, [ws, proj], { body: true }),
  op("states", "operis_update_state", "Atualiza estado", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/states/{state_id}/`, [ws, proj, "state_id"], {
    body: true,
  }),
  op("states", "operis_delete_state", "Remove estado", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/states/{state_id}/`, [ws, proj, "state_id"]),

  op("labels", "operis_list_labels", "Etiquetas", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/labels/`, [ws, proj]),
  op("labels", "operis_create_label", "Cria etiqueta", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/labels/`, [ws, proj], { body: true }),
  op("labels", "operis_update_label", "Atualiza etiqueta", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/labels/{pk}/`, [ws, proj, "pk"], {
    body: true,
  }),
  op("labels", "operis_delete_label", "Remove etiqueta", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/labels/{pk}/`, [ws, proj, "pk"]),

  // Cycles
  op("cycles", "operis_list_cycles", "Ciclos (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/cycles/`, [ws, proj]),
  op("cycles", "operis_create_cycle", "Cria ciclo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/cycles/`, [ws, proj], { body: true }),
  op("cycles", "operis_update_cycle", "Atualiza ciclo", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`, [ws, proj, "pk"], { body: true }),
  op("cycles", "operis_delete_cycle", "Remove ciclo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`, [ws, proj, "pk"]),
  op("cycles", "operis_list_cycle_issues", "Issues no ciclo", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`, [
    ws,
    proj,
    "cycle_id",
  ]),
  op("cycles", "operis_add_cycle_issue", "Adiciona issue ao ciclo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`, [
    ws,
    proj,
    "cycle_id",
  ], { body: true }),
  op("cycles", "operis_remove_cycle_issue", "Remove issue do ciclo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/{issue_id}/`, [
    ws,
    proj,
    "cycle_id",
    "issue_id",
  ]),
  op("cycles", "operis_transfer_cycle_issues", "Transfere issues entre ciclos", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/transfer-issues/`, [
    ws,
    proj,
    "cycle_id",
  ], { body: true }),
  op("cycles", "operis_archive_cycle", "Arquiva ciclo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/archive/`, [ws, proj, "cycle_id"], {
    body: true,
  }),
  op("cycles", "operis_list_archived_cycles", "Ciclos arquivados", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/archived-cycles/`, [ws, proj]),
  op("cycles", "operis_unarchive_cycle", "Desarquiva ciclo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/archived-cycles/{cycle_id}/unarchive/`, [
    ws,
    proj,
    "cycle_id",
  ]),

  // Modules
  op("modules", "operis_list_modules", "Módulos (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/modules/`, [ws, proj]),
  op("modules", "operis_create_module", "Cria módulo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/modules/`, [ws, proj], { body: true }),
  op("modules", "operis_update_module", "Atualiza módulo", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`, [ws, proj, "pk"], { body: true }),
  op("modules", "operis_delete_module", "Remove módulo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`, [ws, proj, "pk"]),
  op("modules", "operis_list_module_issues", "Issues no módulo", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/`, [
    ws,
    proj,
    "module_id",
  ]),
  op("modules", "operis_add_module_issue", "Adiciona issue ao módulo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/`, [
    ws,
    proj,
    "module_id",
  ], { body: true }),
  op("modules", "operis_remove_module_issue", "Remove issue do módulo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/{issue_id}/`, [
    ws,
    proj,
    "module_id",
    "issue_id",
  ]),
  op("modules", "operis_archive_module", "Arquiva módulo", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/archive/`, [ws, proj, "pk"], {
    body: true,
  }),
  op("modules", "operis_list_archived_modules", "Módulos arquivados", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/archived-modules/`, [ws, proj]),
  op("modules", "operis_unarchive_module", "Desarquiva módulo", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/archived-modules/{pk}/unarchive/`, [
    ws,
    proj,
    "pk",
  ]),

  // Estimates
  op("estimates", "operis_list_estimates", "Estimativas (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/estimates/`, [ws, proj]),
  op("estimates", "operis_create_estimate", "Cria estimativa", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/estimates/`, [ws, proj], { body: true }),
  op("estimates", "operis_update_estimate", "Atualiza estimativa", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/estimates/`, [ws, proj], { body: true }),
  op("estimates", "operis_delete_estimate", "Remove estimativa", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/estimates/`, [ws, proj]),
  op("estimates", "operis_list_estimate_points", "Pontos de estimativa", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/`, [
    ws,
    proj,
    "estimate_id",
  ]),
  op("estimates", "operis_create_estimate_point", "Cria ponto", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/`, [
    ws,
    proj,
    "estimate_id",
  ], { body: true }),
  op("estimates", "operis_update_estimate_point", "Atualiza ponto", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/{estimate_point_id}/`, [
    ws,
    proj,
    "estimate_id",
    "estimate_point_id",
  ], { body: true }),
  op("estimates", "operis_delete_estimate_point", "Remove ponto", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/{estimate_point_id}/`, [
    ws,
    proj,
    "estimate_id",
    "estimate_point_id",
  ]),

  // Members
  op("members", "operis_list_workspace_members", "Membros workspace", "v1", "GET", `/workspaces/{${ws}}/members/`, [ws]),
  op("members", "operis_list_project_members", "Membros projeto", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/members/`, [ws, proj]),
  op("members", "operis_add_project_member", "Adiciona membro", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/members/`, [ws, proj], { body: true }),
  op("members", "operis_update_project_member", "Atualiza membro", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/members/{pk}/`, [ws, proj, "pk"], {
    body: true,
  }),
  op("members", "operis_remove_project_member", "Remove membro", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/members/{pk}/`, [ws, proj, "pk"]),
  op("members", "operis_list_project_members_v1", "Project members (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/project-members/`, [ws, proj]),
  op("members", "operis_add_project_member_v1", "Adiciona project member", "v1", "POST", `/workspaces/{${ws}}/projects/{${proj}}/project-members/`, [ws, proj], {
    body: true,
  }),
  op("members", "operis_update_project_member_v1", "Atualiza project member", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/project-members/{pk}/`, [
    ws,
    proj,
    "pk",
  ], { body: true }),
  op("members", "operis_remove_project_member_v1", "Remove project member", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/project-members/{pk}/`, [
    ws,
    proj,
    "pk",
  ]),

  // Intake
  op("intake", "operis_list_intake_issues", "Intake issues (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/`, [ws, proj]),
  op("intake", "operis_get_intake_issue", "Detalhe intake", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`, [ws, proj, "issue_id"]),
  op("intake", "operis_update_intake_issue", "Atualiza intake", "v1", "PATCH", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`, [ws, proj, "issue_id"], {
    body: true,
  }),
  op("intake", "operis_delete_intake_issue", "Remove intake", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`, [ws, proj, "issue_id"]),

  // Assets v1
  op("assets", "operis_create_user_asset", "Upload asset utilizador", "v1", "POST", "/assets/user-assets/", [], { body: true }),
  op("assets", "operis_update_user_asset", "Atualiza asset utilizador", "v1", "PATCH", "/assets/user-assets/{asset_id}/", ["asset_id"], { body: true }),
  op("assets", "operis_delete_user_asset", "Remove asset utilizador", "v1", "DELETE", "/assets/user-assets/{asset_id}/", ["asset_id"]),
  op("assets", "operis_create_workspace_asset", "Upload asset workspace", "v1", "POST", `/workspaces/{${ws}}/assets/`, [ws], { body: true }),
  op("assets", "operis_get_workspace_asset", "Obtém asset workspace", "v1", "GET", `/workspaces/{${ws}}/assets/{asset_id}/`, [ws, "asset_id"]),
  op("assets", "operis_update_workspace_asset", "Atualiza asset workspace", "v1", "PATCH", `/workspaces/{${ws}}/assets/{asset_id}/`, [ws, "asset_id"], {
    body: true,
  }),

  // Stickies
  op("stickies", "operis_list_stickies", "Stickies (v1)", "v1", "GET", `/workspaces/{${ws}}/stickies/`, [ws]),
  op("stickies", "operis_create_sticky", "Cria sticky", "v1", "POST", `/workspaces/{${ws}}/stickies/`, [ws], { body: true }),
  op("stickies", "operis_update_sticky", "Atualiza sticky", "v1", "PATCH", `/workspaces/{${ws}}/stickies/{pk}/`, [ws, "pk"], { body: true }),
  op("stickies", "operis_delete_sticky", "Remove sticky", "v1", "DELETE", `/workspaces/{${ws}}/stickies/{pk}/`, [ws, "pk"]),

  // Invitations v1
  op("invitations", "operis_list_workspace_invitations_v1", "Convites workspace (v1)", "v1", "GET", `/workspaces/{${ws}}/invitations/`, [ws]),
  op("invitations", "operis_create_workspace_invitation_v1", "Cria convite", "v1", "POST", `/workspaces/{${ws}}/invitations/`, [ws], { body: true }),
  op("invitations", "operis_get_workspace_invitation_v1", "Detalhe convite", "v1", "GET", `/workspaces/{${ws}}/invitations/{pk}/`, [ws, "pk"]),
  op("invitations", "operis_update_workspace_invitation_v1", "Atualiza convite", "v1", "PATCH", `/workspaces/{${ws}}/invitations/{pk}/`, [ws, "pk"], {
    body: true,
  }),
  op("invitations", "operis_delete_workspace_invitation_v1", "Remove convite", "v1", "DELETE", `/workspaces/{${ws}}/invitations/{pk}/`, [ws, "pk"]),
];
