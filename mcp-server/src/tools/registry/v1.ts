import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";

export const V1_OPERATIONS = [
  // Projects
  op("projects", "operoz_list_projects", "Lista projetos", "v1", "GET", `/workspaces/{${ws}}/projects/`, [ws]),
  op("projects", "operoz_get_project", "Detalhe projeto", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/`, [
    ws,
    proj,
  ]),
  op("projects", "operoz_create_project", "Cria projeto", "v1", "POST", `/workspaces/{${ws}}/projects/`, [ws], {
    body: true,
  }),
  op(
    "projects",
    "operoz_update_project",
    "Atualiza projeto",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op("projects", "operoz_delete_project", "Remove projeto", "v1", "DELETE", `/workspaces/{${ws}}/projects/{${proj}}/`, [
    ws,
    proj,
  ]),
  op(
    "projects",
    "operoz_archive_project",
    "Arquiva projeto",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/archive/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "projects",
    "operoz_unarchive_project",
    "Desarquiva projeto",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/archive/`,
    [ws, proj]
  ),
  op(
    "projects",
    "operoz_get_project_summary",
    "Resumo do projeto",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/summary/`,
    [ws, proj]
  ),

  // Work items
  op(
    "work_items",
    "operoz_search_work_items",
    "Pesquisa work items",
    "v1",
    "GET",
    `/workspaces/{${ws}}/work-items/search/`,
    [ws]
  ),
  op(
    "work_items",
    "operoz_get_work_item_by_identifier",
    "Work item por identificador PROJ-123",
    "v1",
    "GET",
    `/workspaces/{${ws}}/work-items/{project_identifier}-{issue_identifier}/`,
    [ws, "project_identifier", "issue_identifier"]
  ),
  op(
    "work_items",
    "operoz_list_work_items",
    "Lista work items",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/`,
    [ws, proj]
  ),
  op(
    "work_items",
    "operoz_get_work_item",
    "Detalhe work item",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_create_work_item",
    "Cria work item",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "work_items",
    "operoz_update_work_item",
    "Atualiza work item",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`,
    [ws, proj, "work_item_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_delete_work_item",
    "Remove work item",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_list_work_item_links",
    "Links do work item",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_create_work_item_link",
    "Cria link",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/`,
    [ws, proj, "work_item_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_work_item_link",
    "Atualiza link",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/{pk}/`,
    [ws, proj, "work_item_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_delete_work_item_link",
    "Remove link",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/links/{pk}/`,
    [ws, proj, "work_item_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_list_work_item_comments",
    "Comentários",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_create_work_item_comment",
    "Adiciona comentário",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/`,
    [ws, proj, "work_item_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_work_item_comment",
    "Edita comentário",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/{pk}/`,
    [ws, proj, "work_item_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_delete_work_item_comment",
    "Remove comentário",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/comments/{pk}/`,
    [ws, proj, "work_item_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_list_work_item_activities",
    "Atividades",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/activities/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_list_work_item_attachments",
    "Anexos",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_create_work_item_attachment",
    "Adiciona anexo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/`,
    [ws, proj, "work_item_id"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_update_work_item_attachment",
    "Atualiza anexo",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/{pk}/`,
    [ws, proj, "work_item_id", "pk"],
    { body: true }
  ),
  op(
    "work_items",
    "operoz_delete_work_item_attachment",
    "Remove anexo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/attachments/{pk}/`,
    [ws, proj, "work_item_id", "pk"]
  ),
  op(
    "work_items",
    "operoz_list_work_item_relations",
    "Relações entre items",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/relations/`,
    [ws, proj, "work_item_id"]
  ),
  op(
    "work_items",
    "operoz_create_work_item_relation",
    "Cria relação",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/work-items/{work_item_id}/relations/`,
    [ws, proj, "work_item_id"],
    { body: true }
  ),

  // States & labels
  op(
    "states",
    "operoz_list_states",
    "Estados do projeto",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/states/`,
    [ws, proj]
  ),
  op(
    "states",
    "operoz_create_state",
    "Cria estado",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/states/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "states",
    "operoz_update_state",
    "Atualiza estado",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/states/{state_id}/`,
    [ws, proj, "state_id"],
    {
      body: true,
    }
  ),
  op(
    "states",
    "operoz_delete_state",
    "Remove estado",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/states/{state_id}/`,
    [ws, proj, "state_id"]
  ),

  op("labels", "operoz_list_labels", "Etiquetas", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/labels/`, [
    ws,
    proj,
  ]),
  op(
    "labels",
    "operoz_create_label",
    "Cria etiqueta",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/labels/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "labels",
    "operoz_update_label",
    "Atualiza etiqueta",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/labels/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "labels",
    "operoz_delete_label",
    "Remove etiqueta",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/labels/{pk}/`,
    [ws, proj, "pk"]
  ),

  // Cycles
  op("cycles", "operoz_list_cycles", "Ciclos (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/cycles/`, [
    ws,
    proj,
  ]),
  op(
    "cycles",
    "operoz_create_cycle",
    "Cria ciclo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_update_cycle",
    "Atualiza ciclo",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_delete_cycle",
    "Remove ciclo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "cycles",
    "operoz_list_cycle_issues",
    "Issues no ciclo",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`,
    [ws, proj, "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_add_cycle_issue",
    "Adiciona issue ao ciclo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`,
    [ws, proj, "cycle_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_remove_cycle_issue",
    "Remove issue do ciclo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/{issue_id}/`,
    [ws, proj, "cycle_id", "issue_id"]
  ),
  op(
    "cycles",
    "operoz_transfer_cycle_issues",
    "Transfere issues entre ciclos",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/transfer-issues/`,
    [ws, proj, "cycle_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_archive_cycle",
    "Arquiva ciclo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/archive/`,
    [ws, proj, "cycle_id"],
    {
      body: true,
    }
  ),
  op(
    "cycles",
    "operoz_list_archived_cycles",
    "Ciclos arquivados",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/archived-cycles/`,
    [ws, proj]
  ),
  op(
    "cycles",
    "operoz_unarchive_cycle",
    "Desarquiva ciclo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/archived-cycles/{cycle_id}/unarchive/`,
    [ws, proj, "cycle_id"]
  ),

  // Modules
  op("modules", "operoz_list_modules", "Módulos (v1)", "v1", "GET", `/workspaces/{${ws}}/projects/{${proj}}/modules/`, [
    ws,
    proj,
  ]),
  op(
    "modules",
    "operoz_create_module",
    "Cria módulo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "modules",
    "operoz_update_module",
    "Atualiza módulo",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_delete_module",
    "Remove módulo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "modules",
    "operoz_list_module_issues",
    "Issues no módulo",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/`,
    [ws, proj, "module_id"]
  ),
  op(
    "modules",
    "operoz_add_module_issue",
    "Adiciona issue ao módulo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/`,
    [ws, proj, "module_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_remove_module_issue",
    "Remove issue do módulo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-issues/{issue_id}/`,
    [ws, proj, "module_id", "issue_id"]
  ),
  op(
    "modules",
    "operoz_archive_module",
    "Arquiva módulo",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/archive/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "modules",
    "operoz_list_archived_modules",
    "Módulos arquivados",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/archived-modules/`,
    [ws, proj]
  ),
  op(
    "modules",
    "operoz_unarchive_module",
    "Desarquiva módulo",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/archived-modules/{pk}/unarchive/`,
    [ws, proj, "pk"]
  ),

  // Estimates
  op(
    "estimates",
    "operoz_list_estimates",
    "Estimativas (v1)",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj]
  ),
  op(
    "estimates",
    "operoz_create_estimate",
    "Cria estimativa",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_update_estimate",
    "Atualiza estimativa",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_delete_estimate",
    "Remove estimativa",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj]
  ),
  op(
    "estimates",
    "operoz_list_estimate_points",
    "Pontos de estimativa",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/`,
    [ws, proj, "estimate_id"]
  ),
  op(
    "estimates",
    "operoz_create_estimate_point",
    "Cria ponto",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/`,
    [ws, proj, "estimate_id"],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_update_estimate_point",
    "Atualiza ponto",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/{estimate_point_id}/`,
    [ws, proj, "estimate_id", "estimate_point_id"],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_delete_estimate_point",
    "Remove ponto",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/{estimate_point_id}/`,
    [ws, proj, "estimate_id", "estimate_point_id"]
  ),

  // Members
  op("members", "operoz_list_workspace_members", "Membros workspace", "v1", "GET", `/workspaces/{${ws}}/members/`, [
    ws,
  ]),
  op(
    "members",
    "operoz_list_project_members",
    "Membros projeto",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/members/`,
    [ws, proj]
  ),
  op(
    "members",
    "operoz_add_project_member",
    "Adiciona membro",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/members/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "members",
    "operoz_update_project_member",
    "Atualiza membro",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/members/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "members",
    "operoz_remove_project_member",
    "Remove membro",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/members/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "members",
    "operoz_list_project_members_v1",
    "Project members (v1)",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/project-members/`,
    [ws, proj]
  ),
  op(
    "members",
    "operoz_add_project_member_v1",
    "Adiciona project member",
    "v1",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/project-members/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "members",
    "operoz_update_project_member_v1",
    "Atualiza project member",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/project-members/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
  op(
    "members",
    "operoz_remove_project_member_v1",
    "Remove project member",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/project-members/{pk}/`,
    [ws, proj, "pk"]
  ),

  // Intake
  op(
    "intake",
    "operoz_list_intake_issues",
    "Intake issues (v1)",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/`,
    [ws, proj]
  ),
  op(
    "intake",
    "operoz_get_intake_issue",
    "Detalhe intake",
    "v1",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`,
    [ws, proj, "issue_id"]
  ),
  op(
    "intake",
    "operoz_update_intake_issue",
    "Atualiza intake",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`,
    [ws, proj, "issue_id"],
    {
      body: true,
    }
  ),
  op(
    "intake",
    "operoz_delete_intake_issue",
    "Remove intake",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/intake-issues/{issue_id}/`,
    [ws, proj, "issue_id"]
  ),

  // Assets v1
  op("assets", "operoz_create_user_asset", "Upload asset utilizador", "v1", "POST", "/assets/user-assets/", [], {
    body: true,
  }),
  op(
    "assets",
    "operoz_update_user_asset",
    "Atualiza asset utilizador",
    "v1",
    "PATCH",
    "/assets/user-assets/{asset_id}/",
    ["asset_id"],
    { body: true }
  ),
  op(
    "assets",
    "operoz_delete_user_asset",
    "Remove asset utilizador",
    "v1",
    "DELETE",
    "/assets/user-assets/{asset_id}/",
    ["asset_id"]
  ),
  op(
    "assets",
    "operoz_create_workspace_asset",
    "Upload asset workspace",
    "v1",
    "POST",
    `/workspaces/{${ws}}/assets/`,
    [ws],
    { body: true }
  ),
  op(
    "assets",
    "operoz_get_workspace_asset",
    "Obtém asset workspace",
    "v1",
    "GET",
    `/workspaces/{${ws}}/assets/{asset_id}/`,
    [ws, "asset_id"]
  ),
  op(
    "assets",
    "operoz_update_workspace_asset",
    "Atualiza asset workspace",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/assets/{asset_id}/`,
    [ws, "asset_id"],
    {
      body: true,
    }
  ),

  // Stickies
  op("stickies", "operoz_list_stickies", "Stickies (v1)", "v1", "GET", `/workspaces/{${ws}}/stickies/`, [ws]),
  op("stickies", "operoz_create_sticky", "Cria sticky", "v1", "POST", `/workspaces/{${ws}}/stickies/`, [ws], {
    body: true,
  }),
  op(
    "stickies",
    "operoz_update_sticky",
    "Atualiza sticky",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/stickies/{pk}/`,
    [ws, "pk"],
    { body: true }
  ),
  op("stickies", "operoz_delete_sticky", "Remove sticky", "v1", "DELETE", `/workspaces/{${ws}}/stickies/{pk}/`, [
    ws,
    "pk",
  ]),

  // Invitations v1
  op(
    "invitations",
    "operoz_list_workspace_invitations_v1",
    "Convites workspace (v1)",
    "v1",
    "GET",
    `/workspaces/{${ws}}/invitations/`,
    [ws]
  ),
  op(
    "invitations",
    "operoz_create_workspace_invitation_v1",
    "Cria convite",
    "v1",
    "POST",
    `/workspaces/{${ws}}/invitations/`,
    [ws],
    { body: true }
  ),
  op(
    "invitations",
    "operoz_get_workspace_invitation_v1",
    "Detalhe convite",
    "v1",
    "GET",
    `/workspaces/{${ws}}/invitations/{pk}/`,
    [ws, "pk"]
  ),
  op(
    "invitations",
    "operoz_update_workspace_invitation_v1",
    "Atualiza convite",
    "v1",
    "PATCH",
    `/workspaces/{${ws}}/invitations/{pk}/`,
    [ws, "pk"],
    {
      body: true,
    }
  ),
  op(
    "invitations",
    "operoz_delete_workspace_invitation_v1",
    "Remove convite",
    "v1",
    "DELETE",
    `/workspaces/{${ws}}/invitations/{pk}/`,
    [ws, "pk"]
  ),
];
