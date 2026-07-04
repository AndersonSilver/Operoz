import { op } from "./types.js";

export const APP_AUTOMATION_OPERATIONS = [
  op(
    "automation",
    "operoz_board_automation_catalog_get",
    "Board Automation Catalog (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/catalog/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_dead_letter_list_get",
    "Board Automation Dead Letter List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/dead-letters/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_dry_run_post",
    "Board Automation Dry Run (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/dry-run/",
    ["workspace_slug","board_slug","rule_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_delete",
    "Board Automation Email Template Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/",
    ["workspace_slug","board_slug","template_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_get",
    "Board Automation Email Template Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/",
    ["workspace_slug","board_slug","template_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_detail_patch",
    "Board Automation Email Template Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/{template_id}/",
    ["workspace_slug","board_slug","template_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_list_get",
    "Board Automation Email Template List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_email_template_list_post",
    "Board Automation Email Template List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/email-templates/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_hook_detail_delete",
    "Board Automation Hook Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/{hook_id}/",
    ["workspace_slug","board_slug","hook_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_hook_detail_patch",
    "Board Automation Hook Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/{hook_id}/",
    ["workspace_slug","board_slug","hook_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_hook_list_get",
    "Board Automation Hook List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_hook_list_post",
    "Board Automation Hook List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/hooks/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_metrics_get",
    "Board Automation Metrics (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/metrics/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_pack_install_post",
    "Board Automation Pack Install (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/{pack_name}/install/",
    ["workspace_slug","board_slug","pack_name"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_pack_list_get",
    "Board Automation Pack List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_pack_uninstall_post",
    "Board Automation Pack Uninstall (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/packs/{pack_name}/uninstall/",
    ["workspace_slug","board_slug","pack_name"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_policy_get",
    "Board Automation Policy (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/policy/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_policy_patch",
    "Board Automation Policy (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/policy/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_publish_audit_list_get",
    "Board Automation Publish Audit List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/publish-audits/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_delete",
    "Board Automation Rule Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/",
    ["workspace_slug","board_slug","rule_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_get",
    "Board Automation Rule Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/",
    ["workspace_slug","board_slug","rule_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_detail_patch",
    "Board Automation Rule Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/",
    ["workspace_slug","board_slug","rule_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_list_get",
    "Board Automation Rule List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_list_post",
    "Board Automation Rule List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_publish_post",
    "Board Automation Rule Publish (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/publish/",
    ["workspace_slug","board_slug","rule_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_rule_revision_list_get",
    "Board Automation Rule Revision List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/revisions/",
    ["workspace_slug","board_slug","rule_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_rule_revision_restore_post",
    "Board Automation Rule Revision Restore (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/rules/{rule_id}/revisions/{revision_id}/restore/",
    ["workspace_slug","board_slug","rule_id","revision_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_run_list_get",
    "Board Automation Run List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/runs/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_delete",
    "Board Automation Script Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/",
    ["workspace_slug","board_slug","script_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_get",
    "Board Automation Script Detail (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/",
    ["workspace_slug","board_slug","script_id"]
  ),
  op(
    "automation",
    "operoz_board_automation_script_detail_patch",
    "Board Automation Script Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/{script_id}/",
    ["workspace_slug","board_slug","script_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_script_list_get",
    "Board Automation Script List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_script_list_post",
    "Board Automation Script List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/scripts/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_detail_delete",
    "Board Automation Secret Detail (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/{secret_id}/",
    ["workspace_slug","board_slug","secret_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_detail_patch",
    "Board Automation Secret Detail (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/{secret_id}/",
    ["workspace_slug","board_slug","secret_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_secret_list_get",
    "Board Automation Secret List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_secret_list_post",
    "Board Automation Secret List (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/secrets/",
    ["workspace_slug","board_slug"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_template_install_post",
    "Board Automation Template Install (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/templates/{template_id}/install/",
    ["workspace_slug","board_slug","template_id"], { body: true }
  ),
  op(
    "automation",
    "operoz_board_automation_template_list_get",
    "Board Automation Template List (Consulta)",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/templates/",
    ["workspace_slug","board_slug"]
  ),
  op(
    "automation",
    "operoz_board_automation_validate_post",
    "Board Automation Validate (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/boards/{board_slug}/automation/validate/",
    ["workspace_slug","board_slug"], { body: true }
  ),
];
