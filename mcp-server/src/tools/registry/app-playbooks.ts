import { op } from "./types.js";

export const APP_PLAYBOOK_OPERATIONS = [
  op(
    "playbooks",
    "operoz_board_playbook_detail_delete",
    "Board Playbook Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/",
    ["workspace_slug","board_slug","playbook_id"], { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_detail_get",
    "Board Playbook Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/",
    ["workspace_slug","board_slug","playbook_id"]
  ),
  op(
    "playbooks",
    "operoz_board_playbook_detail_patch",
    "Board Playbook Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/",
    ["workspace_slug","board_slug","playbook_id"], { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_list_get",
    "Board Playbook List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "playbooks",
    "operoz_board_playbook_list_post",
    "Board Playbook List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "playbooks",
    "operoz_board_playbook_publish_post",
    "Board Playbook Publish (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/playbooks/{playbook_id}/publish/",
    ["workspace_slug","board_slug","playbook_id"], { body: true }
  ),
];
