import { op } from "./types.js";

export const APP_PLANNING_OPERATIONS = [
  op(
    "estimates",
    "operoz_bulk_estimate_point_retrieve_get",
    "BulkEstimatePointEndpoint.retrieve (GET)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/{estimate_id}/",
    ["workspace_slug","project_id","estimate_id"]
  ),
  op(
    "estimates",
    "operoz_create_estimate_app",
    "Cria estimativa (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "estimates",
    "operoz_create_estimate_point_app",
    "Cria ponto (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/{estimate_id}/estimate-points/",
    ["workspace_slug","project_id","estimate_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_create_inbox",
    "Cria inbox",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/inboxes/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_create_intake",
    "Cria intake config",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/intakes/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "states",
    "operoz_create_state_app",
    "Cria estado",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "estimates",
    "operoz_delete_estimate_app",
    "Remove estimativa (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/{estimate_id}/",
    ["workspace_slug","project_id","estimate_id"]
  ),
  op(
    "states",
    "operoz_delete_state_app",
    "Remove estado",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "states",
    "operoz_get_intake_state",
    "Estado intake",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-state/",
    ["workspace_slug","project_id"]
  ),
  op(
    "estimates",
    "operoz_get_project_estimates",
    "Estimativas projeto",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/project-estimates/",
    ["workspace_slug","project_id"]
  ),
  op(
    "intake",
    "operoz_intake_destroy_delete",
    "Intake — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/intakes/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_destroy_delete_2",
    "Intake — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/inboxes/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_form_detail_delete",
    "Intake Form Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/",
    ["workspace_slug","project_id","form_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_form_detail_get",
    "Intake Form Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/",
    ["workspace_slug","project_id","form_id"]
  ),
  op(
    "intake",
    "operoz_intake_form_detail_patch",
    "Intake Form Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/{form_id}/",
    ["workspace_slug","project_id","form_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_form_list_create_get",
    "Intake Form List Create (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/",
    ["workspace_slug","project_id"]
  ),
  op(
    "intake",
    "operoz_intake_form_list_create_post",
    "Intake Form List Create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-forms/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_issue_destroy_delete",
    "Intake Issue — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "intake",
    "operoz_intake_issue_retrieve_get",
    "Intake Issue — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/inbox-issues/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "intake",
    "operoz_intake_retrieve_get",
    "Intake — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intakes/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "intake",
    "operoz_intake_retrieve_get_2",
    "Intake — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/inboxes/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "intake",
    "operoz_intake_work_item_description_version_get",
    "Intake Work Item Description Version (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/",
    ["workspace_slug","project_id","work_item_id"]
  ),
  op(
    "intake",
    "operoz_intake_work_item_description_version_get_2",
    "Intake Work Item Description Version (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intake-work-items/{work_item_id}/description-versions/{pk}/",
    ["workspace_slug","project_id","work_item_id","pk"]
  ),
  op(
    "estimates",
    "operoz_list_estimates_app",
    "Lista estimativas (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/",
    ["workspace_slug","project_id"]
  ),
  op(
    "intake",
    "operoz_list_inboxes",
    "Inboxes",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/inboxes/",
    ["workspace_slug","project_id"]
  ),
  op(
    "intake",
    "operoz_list_intakes",
    "Config intake",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/intakes/",
    ["workspace_slug","project_id"]
  ),
  op(
    "states",
    "operoz_list_states_app",
    "Estados (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/",
    ["workspace_slug","project_id"]
  ),
  op(
    "states",
    "operoz_mark_default_state",
    "Marca estado default",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/{pk}/mark-default/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "states",
    "operoz_state_retrieve_get",
    "State — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "estimates",
    "operoz_update_estimate_app",
    "Atualiza estimativa (app)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/estimates/{estimate_id}/",
    ["workspace_slug","project_id","estimate_id"], { body: true }
  ),
  op(
    "intake",
    "operoz_update_inbox",
    "Atualiza inbox",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/inboxes/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "intake",
    "operoz_update_intake",
    "Atualiza intake config",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/intakes/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "states",
    "operoz_update_state_app",
    "Atualiza estado",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/states/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
];
