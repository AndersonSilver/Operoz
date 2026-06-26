import { NavLink, Outlet, useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { joinUrlPath } from "@operis/utils";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";

const TABS = [
  { key: "rules", href: "rules" },
  { key: "preferences", href: "preferences" },
  { key: "external_accounts", href: "external-accounts" },
  { key: "logs", href: "logs" },
] as const;

function NotificationsSettingsLayout() {
  const { workspaceSlug = "" } = useParams();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const base = joinUrlPath(workspaceSlug, "settings/notifications");

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.notifications.title")}`
    : undefined;

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <div className="mb-6">
        <h1 className="text-16 font-semibold text-primary">{t("workspace_settings.settings.notifications.title")}</h1>
        <p className="mt-1 text-13 text-secondary">{t("workspace_settings.settings.notifications.description")}</p>
      </div>
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-subtle pb-2">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={joinUrlPath(base, tab.href)}
            className={({ isActive }) =>
              `rounded-sm px-3 py-1.5 text-13 ${isActive ? "bg-layer-1 text-primary" : "text-secondary hover:bg-layer-transparent-hover"}`
            }
          >
            {t(`workspace_settings.settings.notifications.tabs.${tab.key}`)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </SettingsContentWrapper>
  );
}

export default observer(NotificationsSettingsLayout);
