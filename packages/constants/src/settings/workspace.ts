// plane imports
import type { TWorkspaceSettingsItem, TWorkspaceSettingsTabs } from "@operis/types";
import { EUserWorkspaceRoles } from "@operis/types";

export enum WORKSPACE_SETTINGS_CATEGORY {
  ADMINISTRATION = "administration",
  FEATURES = "features",
  DEVELOPER = "developer",
}

export const WORKSPACE_SETTINGS_CATEGORIES: WORKSPACE_SETTINGS_CATEGORY[] = [
  WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION,
  WORKSPACE_SETTINGS_CATEGORY.FEATURES,
  WORKSPACE_SETTINGS_CATEGORY.DEVELOPER,
];

export const WORKSPACE_SETTINGS: Record<TWorkspaceSettingsTabs, TWorkspaceSettingsItem> = {
  general: {
    key: "general",
    i18n_label: "workspace_settings.settings.general.title",
    href: `/settings`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/`,
  },
  members: {
    key: "members",
    i18n_label: "workspace_settings.settings.members.title",
    href: `/settings/members`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/members/`,
  },
  export: {
    key: "export",
    i18n_label: "workspace_settings.settings.exports.title",
    href: `/settings/exports`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/exports/`,
  },
  boards: {
    key: "boards",
    i18n_label: "workspace_settings.settings.boards.title",
    href: `/settings/boards`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/boards/`,
  },
  assistant: {
    key: "assistant",
    i18n_label: "workspace_settings.settings.assistant.title",
    href: `/settings/assistant`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/assistant/`,
  },
  discord: {
    key: "discord",
    i18n_label: "workspace_settings.settings.discord.title",
    href: `/settings/discord`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/discord/`,
  },
  jira: {
    key: "jira",
    i18n_label: "workspace_settings.settings.jira.title",
    href: `/settings/jira`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/jira/`,
  },
  notifications: {
    key: "notifications",
    i18n_label: "workspace_settings.settings.notifications.title",
    href: `/settings/notifications`,
    access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    highlight: (pathname: string, baseUrl: string) => new RegExp(`^${baseUrl}/settings/notifications/`).test(pathname),
  },
  webhooks: {
    key: "webhooks",
    i18n_label: "workspace_settings.settings.webhooks.title",
    href: `/settings/webhooks`,
    access: [EUserWorkspaceRoles.ADMIN],
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}/settings/webhooks/`,
  },
};

export const WORKSPACE_SETTINGS_ACCESS = Object.fromEntries(
  Object.entries(WORKSPACE_SETTINGS).map(([_, { href, access }]) => [href, access])
);

export const GROUPED_WORKSPACE_SETTINGS: Record<WORKSPACE_SETTINGS_CATEGORY, TWorkspaceSettingsItem[]> = {
  [WORKSPACE_SETTINGS_CATEGORY.ADMINISTRATION]: [
    WORKSPACE_SETTINGS["general"],
    WORKSPACE_SETTINGS["members"],
    WORKSPACE_SETTINGS["export"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.FEATURES]: [
    WORKSPACE_SETTINGS["boards"],
    WORKSPACE_SETTINGS["assistant"],
    WORKSPACE_SETTINGS["notifications"],
    WORKSPACE_SETTINGS["discord"],
    WORKSPACE_SETTINGS["jira"],
  ],
  [WORKSPACE_SETTINGS_CATEGORY.DEVELOPER]: [WORKSPACE_SETTINGS["webhooks"]],
};
