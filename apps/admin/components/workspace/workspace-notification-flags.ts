export type NotificationFlagKey =
  | "issue_notify_assignees_always_email"
  | "issue_notify_email_include_extended_activities"
  | "issue_notify_email_include_description_changes"
  | "issue_notify_email_dispatch_immediately";

export type NotificationFlagConfig = {
  key: NotificationFlagKey;
  titleKey: string;
  descriptionKey: string;
};

export const WORKSPACE_NOTIFICATION_FLAGS: NotificationFlagConfig[] = [
  {
    key: "issue_notify_assignees_always_email",
    titleKey: "boards.settings.notifications.flags.assignees_always.title",
    descriptionKey: "boards.settings.notifications.flags.assignees_always.description",
  },
  {
    key: "issue_notify_email_include_extended_activities",
    titleKey: "boards.settings.notifications.flags.extended_activities.title",
    descriptionKey: "boards.settings.notifications.flags.extended_activities.description",
  },
  {
    key: "issue_notify_email_include_description_changes",
    titleKey: "boards.settings.notifications.flags.description_changes.title",
    descriptionKey: "boards.settings.notifications.flags.description_changes.description",
  },
  {
    key: "issue_notify_email_dispatch_immediately",
    titleKey: "boards.settings.notifications.flags.immediate_dispatch.title",
    descriptionKey: "boards.settings.notifications.flags.immediate_dispatch.description",
  },
];
