export type IntegrationFlagKey = "is_google_calendar_enabled" | "is_discord_dm_enabled";

export type IntegrationFlagConfig = {
  key: IntegrationFlagKey;
  titleKey: string;
  descriptionKey: string;
};

export const WORKSPACE_INTEGRATION_FLAGS: IntegrationFlagConfig[] = [
  {
    key: "is_google_calendar_enabled",
    titleKey: "god_mode.pages.workspace.integrations.google_calendar.title",
    descriptionKey: "god_mode.pages.workspace.integrations.google_calendar.description",
  },
  {
    key: "is_discord_dm_enabled",
    titleKey: "god_mode.pages.workspace.integrations.discord_dm.title",
    descriptionKey: "god_mode.pages.workspace.integrations.discord_dm.description",
  },
];
