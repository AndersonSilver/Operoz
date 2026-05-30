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
  { key: "automation", href: "/automacao", i18n_label: "boards.settings.nav.automation" },
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
