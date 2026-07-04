import { op } from "./types.js";

export const APP_NOTIFICATION_OPERATIONS = [
  op(
    "notifications",
    "operoz_get_notification",
    "Detalhe notificação",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/",
    ["workspace_slug","pk"]
  ),
  op(
    "notifications",
    "operoz_list_notifications",
    "Notificações",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/users/notifications/",
    ["workspace_slug"]
  ),
  op(
    "notifications",
    "operoz_list_unread_notifications",
    "Não lidas",
    "app",
    "GET",
    "/workspaces/{workspace_slug}/users/notifications/unread/",
    ["workspace_slug"]
  ),
  op(
    "notifications",
    "operoz_mark_all_notifications_read",
    "Marca todas lidas",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/users/notifications/mark-all-read/",
    ["workspace_slug"], { body: true }
  ),
  op(
    "notifications",
    "operoz_mark_notification_read",
    "Marca lida",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/read/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_archive_post",
    "Notification — archive (Executa)",
    "app",
    "POST",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/archive/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_destroy_delete",
    "Notification — destroy (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_mark_unread_delete",
    "Notification — mark unread (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/read/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_partial_update_patch",
    "Notification — partial update (Atualiza)",
    "app",
    "PATCH",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/",
    ["workspace_slug","pk"], { body: true }
  ),
  op(
    "notifications",
    "operoz_notification_unarchive_delete",
    "Notification — unarchive (Remove)",
    "app",
    "DELETE",
    "/workspaces/{workspace_slug}/users/notifications/{pk}/archive/",
    ["workspace_slug","pk"], { body: true }
  ),
];
