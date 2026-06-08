export type TBoardSettingsNavItem = {
  key: string;
  /** Path after `/{ws}/settings/boards/{boardSlug}` (empty = Informações). */
  href: string;
  i18n_label: string;
  children?: TBoardSettingsNavItem[];
};

/** Sidebar de configurações do board — ordem fixa. */
export const BOARD_SETTINGS_NAV: TBoardSettingsNavItem[] = [
  { key: "informations", href: "", i18n_label: "boards.settings.nav.informations" },
  { key: "access", href: "/acesso", i18n_label: "boards.settings.nav.access" },
  {
    key: "notifications",
    href: "/notificacoes",
    i18n_label: "boards.settings.nav.notifications",
    children: [
      {
        key: "notifications_settings",
        href: "/notificacoes",
        i18n_label: "boards.settings.nav.notifications_settings",
      },
      {
        key: "email_audit",
        href: "/notificacoes/auditoria-email",
        i18n_label: "boards.settings.nav.email_audit",
      },
    ],
  },
  {
    key: "automation",
    href: "/automacao",
    i18n_label: "boards.settings.nav.automation",
    children: [
      { key: "automation_rules", href: "/automacao", i18n_label: "boards.settings.nav.automation_rules" },
      { key: "automation_scripts", href: "/automacao/scripts", i18n_label: "boards.settings.nav.automation_scripts" },
      { key: "automation_emails", href: "/automacao/emails", i18n_label: "boards.settings.nav.automation_emails" },
      {
        key: "automation_event_history",
        href: "/automacao/historico",
        i18n_label: "boards.settings.nav.automation_event_history",
      },
      {
        key: "automation_metrics",
        href: "/automacao/metricas",
        i18n_label: "boards.settings.nav.automation_metrics",
      },
      {
        key: "automation_dead_letters",
        href: "/automacao/falhas",
        i18n_label: "boards.settings.nav.automation_dead_letters",
      },
      {
        key: "automation_secrets",
        href: "/automacao/segredos",
        i18n_label: "boards.settings.nav.automation_secrets",
      },
    ],
  },
  { key: "fields", href: "/campos", i18n_label: "boards.settings.nav.fields" },
  {
    key: "issue_types",
    href: "/tipos",
    i18n_label: "boards.settings.nav.issue_types",
    children: [
      { key: "issue_types_list", href: "/tipos", i18n_label: "boards.settings.nav.issue_types_list" },
      { key: "project_schema", href: "/tipos/projeto", i18n_label: "boards.settings.nav.project_schema" },
    ],
  },
  { key: "roles", href: "/funcoes", i18n_label: "boards.settings.nav.roles" },
  { key: "board_view", href: "/quadro", i18n_label: "boards.settings.nav.board_view" },
  { key: "timeline", href: "/cronograma", i18n_label: "boards.settings.nav.timeline" },
];

export const BOARD_SETTINGS_FLAT = BOARD_SETTINGS_NAV.flatMap((item) =>
  item.children ? [item, ...item.children] : [item]
);

export const getBoardSettingsSection = (key: string) =>
  BOARD_SETTINGS_FLAT.find((item) => item.key === key);
