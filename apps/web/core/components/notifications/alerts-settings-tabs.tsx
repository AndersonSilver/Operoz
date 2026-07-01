import { NavLink } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/ui";
import { joinUrlPath } from "@operoz/utils";

const TABS = [
  { key: "rules", href: "rules" },
  { key: "preferences", href: "preferences" },
  { key: "external_accounts", href: "external-accounts" },
  { key: "logs", href: "logs" },
] as const;

type Props = {
  workspaceSlug: string;
};

export function AlertsSettingsTabs(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const base = joinUrlPath(workspaceSlug, "settings/notifications");

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-xl border border-subtle bg-layer-1 p-1"
      aria-label={t("workspace_settings.settings.notifications.title")}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={joinUrlPath(base, tab.href)}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3.5 py-2 text-13 font-medium transition-colors",
              isActive
                ? "shadow-sm bg-surface-1 text-primary"
                : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
            )
          }
        >
          {t(`workspace_settings.settings.notifications.tabs.${tab.key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
