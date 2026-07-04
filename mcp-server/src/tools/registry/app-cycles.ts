import { op } from "./types.js";

export const APP_CYCLE_OPERATIONS = [
  op(
    "cycles",
    "operoz_add_cycle_issue_app",
    "Adiciona ao ciclo",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/",
    ["workspace_slug","project_id","cycle_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_create_cycle_app",
    "Cria ciclo (app)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete",
    "Cycle Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/archive/",
    ["workspace_slug","project_id","cycle_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete_2",
    "Cycle Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_delete_3",
    "Cycle Archive Unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_get",
    "Cycle Archive Unarchive (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/archive/",
    ["workspace_slug","project_id","cycle_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_get_2",
    "Cycle Archive Unarchive (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_post",
    "Cycle Archive Unarchive (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_archive_unarchive_post_2",
    "Cycle Archive Unarchive (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/archived-cycles/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_date_check",
    "Valida datas ciclo",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/date-check/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_create_post",
    "Cycle Favorite — create (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/",
    ["workspace_slug","project_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_destroy_delete",
    "Cycle Favorite — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/{cycle_id}/",
    ["workspace_slug","project_id","cycle_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_favorite_list_get",
    "Cycle Favorite — list (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/user-favorite-cycles/",
    ["workspace_slug","project_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_issue_partial_update_patch",
    "Cycle Issue — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/",
    ["workspace_slug","project_id","cycle_id","issue_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_issue_retrieve_get",
    "Cycle Issue — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/",
    ["workspace_slug","project_id","cycle_id","issue_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_issue_update_put",
    "Cycle Issue — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/{issue_id}/",
    ["workspace_slug","project_id","cycle_id","issue_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_retrieve_get",
    "Cycle — retrieve (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "cycles",
    "operoz_cycle_update_put",
    "Cycle — update (Substitui)",
    "app",
    "PUT",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
  op(
    "cycles",
    "operoz_cycle_user_properties_get",
    "Cycle User Properties (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/user-properties/",
    ["workspace_slug","project_id","cycle_id"]
  ),
  op(
    "cycles",
    "operoz_cycle_user_properties_patch",
    "Cycle User Properties (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/user-properties/",
    ["workspace_slug","project_id","cycle_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_delete_cycle_app",
    "Remove ciclo (app)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/",
    ["workspace_slug","project_id","pk"]
  ),
  op(
    "cycles",
    "operoz_get_cycle_analytics",
    "Analytics do ciclo",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/analytics/",
    ["workspace_slug","project_id","cycle_id"]
  ),
  op(
    "cycles",
    "operoz_get_cycle_progress",
    "Progresso do ciclo",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/progress/",
    ["workspace_slug","project_id","cycle_id"]
  ),
  op(
    "cycles",
    "operoz_list_cycle_issues_app",
    "Issues no ciclo (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/cycle-issues/",
    ["workspace_slug","project_id","cycle_id"]
  ),
  op(
    "cycles",
    "operoz_list_cycles_app",
    "Ciclos (app)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/",
    ["workspace_slug","project_id"]
  ),
  op(
    "cycles",
    "operoz_transfer_cycle_issues_app",
    "Transfere issues",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{cycle_id}/transfer-issues/",
    ["workspace_slug","project_id","cycle_id"], { body: true }
  ),
  op(
    "cycles",
    "operoz_update_cycle_app",
    "Atualiza ciclo (app)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/projects/{project_id}/cycles/{pk}/",
    ["workspace_slug","project_id","pk"], { body: true }
  ),
];
