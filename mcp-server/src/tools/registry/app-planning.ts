import { op } from "./types.js";

const ws = "workspace_slug";
const proj = "project_id";

export const APP_PLANNING_OPERATIONS = [
  // States app
  op(
    "states",
    "operoz_list_states_app",
    "Estados (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/states/`,
    [ws, proj]
  ),
  op(
    "states",
    "operoz_create_state_app",
    "Cria estado",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/states/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "states",
    "operoz_update_state_app",
    "Atualiza estado",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/states/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "states",
    "operoz_delete_state_app",
    "Remove estado",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/states/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "states",
    "operoz_get_intake_state",
    "Estado intake",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/intake-state/`,
    [ws, proj]
  ),
  op(
    "states",
    "operoz_mark_default_state",
    "Marca estado default",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/states/{pk}/mark-default/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),

  // Cycles app
  op(
    "cycles",
    "operoz_list_cycles_app",
    "Ciclos (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/`,
    [ws, proj]
  ),
  op(
    "cycles",
    "operoz_create_cycle_app",
    "Cria ciclo (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_update_cycle_app",
    "Atualiza ciclo (app)",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "cycles",
    "operoz_delete_cycle_app",
    "Remove ciclo (app)",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "cycles",
    "operoz_cycle_date_check",
    "Valida datas ciclo",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/date-check/`,
    [ws, proj],
    {
      body: true,
    }
  ),
  op(
    "cycles",
    "operoz_get_cycle_progress",
    "Progresso do ciclo",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/progress/`,
    [ws, proj, "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_get_cycle_analytics",
    "Analytics do ciclo",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/analytics/`,
    [ws, proj, "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_list_cycle_issues_app",
    "Issues no ciclo (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`,
    [ws, proj, "cycle_id"]
  ),
  op(
    "cycles",
    "operoz_add_cycle_issue_app",
    "Adiciona ao ciclo",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/cycle-issues/`,
    [ws, proj, "cycle_id"],
    { body: true }
  ),
  op(
    "cycles",
    "operoz_transfer_cycle_issues_app",
    "Transfere issues",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/cycles/{cycle_id}/transfer-issues/`,
    [ws, proj, "cycle_id"],
    { body: true }
  ),

  // Modules app
  op(
    "modules",
    "operoz_list_modules_app",
    "Módulos (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/`,
    [ws, proj]
  ),
  op(
    "modules",
    "operoz_create_module_app",
    "Cria módulo (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "modules",
    "operoz_update_module_app",
    "Atualiza módulo (app)",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op(
    "modules",
    "operoz_delete_module_app",
    "Remove módulo (app)",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{pk}/`,
    [ws, proj, "pk"]
  ),
  op(
    "modules",
    "operoz_list_module_links",
    "Links do módulo",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-links/`,
    [ws, proj, "module_id"]
  ),
  op(
    "modules",
    "operoz_create_module_link",
    "Cria link módulo",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/module-links/`,
    [ws, proj, "module_id"],
    { body: true }
  ),
  op(
    "modules",
    "operoz_list_module_issues_app",
    "Issues no módulo (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/issues/`,
    [ws, proj, "module_id"]
  ),
  op(
    "modules",
    "operoz_add_module_issue_app",
    "Adiciona issue ao módulo",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/modules/{module_id}/issues/`,
    [ws, proj, "module_id"],
    { body: true }
  ),

  // Estimates app
  op(
    "estimates",
    "operoz_get_project_estimates",
    "Estimativas projeto",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/project-estimates/`,
    [ws, proj]
  ),
  op(
    "estimates",
    "operoz_list_estimates_app",
    "Lista estimativas (app)",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj]
  ),
  op(
    "estimates",
    "operoz_create_estimate_app",
    "Cria estimativa (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_update_estimate_app",
    "Atualiza estimativa (app)",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/`,
    [ws, proj, "estimate_id"],
    { body: true }
  ),
  op(
    "estimates",
    "operoz_delete_estimate_app",
    "Remove estimativa (app)",
    "app",
    "DELETE",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/`,
    [ws, proj, "estimate_id"]
  ),
  op(
    "estimates",
    "operoz_create_estimate_point_app",
    "Cria ponto (app)",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/estimates/{estimate_id}/estimate-points/`,
    [ws, proj, "estimate_id"],
    { body: true }
  ),

  // Intake config
  op(
    "intake",
    "operoz_list_intakes",
    "Config intake",
    "app",
    "GET",
    `/workspaces/{${ws}}/projects/{${proj}}/intakes/`,
    [ws, proj]
  ),
  op(
    "intake",
    "operoz_create_intake",
    "Cria intake config",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/intakes/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "intake",
    "operoz_update_intake",
    "Atualiza intake config",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/intakes/{pk}/`,
    [ws, proj, "pk"],
    {
      body: true,
    }
  ),
  op("intake", "operoz_list_inboxes", "Inboxes", "app", "GET", `/workspaces/{${ws}}/projects/{${proj}}/inboxes/`, [
    ws,
    proj,
  ]),
  op(
    "intake",
    "operoz_create_inbox",
    "Cria inbox",
    "app",
    "POST",
    `/workspaces/{${ws}}/projects/{${proj}}/inboxes/`,
    [ws, proj],
    { body: true }
  ),
  op(
    "intake",
    "operoz_update_inbox",
    "Atualiza inbox",
    "app",
    "PATCH",
    `/workspaces/{${ws}}/projects/{${proj}}/inboxes/{pk}/`,
    [ws, proj, "pk"],
    { body: true }
  ),
];
