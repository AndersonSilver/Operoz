import { op } from "./types.js";

export const APP_USER_OPERATIONS = [
  op(
    "users",
    "operoz_account_delete",
    "Account (Remove)",
    "app",
    "DELETE",
    "/users/me/accounts/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_account_delete_2",
    "Account (Remove)",
    "app",
    "DELETE",
    "/users/me/accounts/{pk}/",
    ["pk"], { body: true }
  ),
  op(
    "users",
    "operoz_account_get",
    "Account (Consulta)",
    "app",
    "GET",
    "/users/me/accounts/",
    []
  ),
  op(
    "users",
    "operoz_account_get_2",
    "Account (Consulta)",
    "app",
    "GET",
    "/users/me/accounts/{pk}/",
    ["pk"]
  ),
  op(
    "users",
    "operoz_create_api_token",
    "Cria API token",
    "app",
    "POST",
    "/users/api-tokens/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_delete_api_token",
    "Revoga token",
    "app",
    "DELETE",
    "/users/api-tokens/{pk}/",
    ["pk"]
  ),
  op(
    "users",
    "operoz_get_me_app",
    "Perfil (app)",
    "app",
    "GET",
    "/users/me/",
    []
  ),
  op(
    "users",
    "operoz_get_me_dashboard",
    "Dashboard pessoal",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/dashboard/",
    ["workspace_slug"]
  ),
  op(
    "users",
    "operoz_get_me_profile",
    "Perfil detalhado",
    "app",
    "GET",
    "/users/me/profile/",
    []
  ),
  op(
    "users",
    "operoz_get_me_settings",
    "Definições",
    "app",
    "GET",
    "/users/me/settings/",
    []
  ),
  op(
    "users",
    "operoz_get_notification_preferences",
    "Prefs notificações",
    "app",
    "GET",
    "/users/me/notification-preferences/",
    []
  ),
  op(
    "users",
    "operoz_get_session",
    "Sessão",
    "app",
    "GET",
    "/users/session/",
    []
  ),
  op(
    "users",
    "operoz_list_api_tokens",
    "API tokens",
    "app",
    "GET",
    "/users/api-tokens/",
    []
  ),
  op(
    "users",
    "operoz_update_me_app",
    "Atualiza perfil",
    "app",
    "PATCH",
    "/users/me/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_update_me_profile",
    "Atualiza perfil detalhado",
    "app",
    "PATCH",
    "/users/me/profile/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_update_notification_preferences",
    "Atualiza prefs",
    "app",
    "PATCH",
    "/users/me/notification-preferences/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_update_user_on_boarded_patch",
    "Update User On Boarded (Atualiza)",
    "app",
    "PATCH",
    "/users/me/onboard/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_update_user_tour_completed_patch",
    "Update User Tour Completed (Atualiza)",
    "app",
    "PATCH",
    "/users/me/tour-completed/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_user_activity_get",
    "User Activity (Consulta)",
    "app",
    "GET",
    "/users/me/activities/",
    []
  ),
  op(
    "users",
    "operoz_user_activity_graph_get",
    "User Activity Graph (Consulta)",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/activity-graph/",
    ["workspace_slug"]
  ),
  op(
    "users",
    "operoz_user_deactivate_delete",
    "UserEndpoint.deactivate (DELETE)",
    "app",
    "DELETE",
    "/users/me/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_user_generate_email_verification_code_post",
    "UserEndpoint.generate_email_verification_code (POST)",
    "app",
    "POST",
    "/users/me/email/generate-code/",
    [], { body: true }
  ),
  op(
    "users",
    "operoz_user_issue_completed_graph_get",
    "User Issue Completed Graph (Consulta)",
    "app",
    "GET",
    "/users/me/workspaces/{workspace_slug}/issues-completed-graph/",
    ["workspace_slug"]
  ),
  op(
    "users",
    "operoz_user_retrieve_instance_admin_get",
    "UserEndpoint.retrieve_instance_admin (GET)",
    "app",
    "GET",
    "/users/me/instance-admin/",
    []
  ),
  op(
    "users",
    "operoz_user_update_email_patch",
    "UserEndpoint.update_email (PATCH)",
    "app",
    "PATCH",
    "/users/me/email/",
    [], { body: true }
  ),
];
