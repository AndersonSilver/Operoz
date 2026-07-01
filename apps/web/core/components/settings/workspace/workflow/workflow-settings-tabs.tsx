import { NavLink } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/ui";
import { joinUrlPath } from "@operoz/utils";

const TABS = [
  { key: "workflows", href: "" },
  { key: "schemes", href: "schemes" },
] as const;

type Props = {
  workspaceSlug: string;
};

export function WorkflowSettingsTabs(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const base = joinUrlPath(workspaceSlug, "settings/workflow");

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-md border border-subtle bg-layer-1 p-1"
      aria-label={t("workspace_settings.settings.workflow.title")}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.href ? joinUrlPath(base, tab.href) : base}
          end={tab.href === ""}
          className={({ isActive }) =>
            cn(
              "rounded-sm px-3.5 py-2 text-13 font-medium transition-colors",
              isActive
                ? "shadow-sm bg-surface-1 text-primary"
                : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
            )
          }
        >
          {t(`workspace_settings.settings.workflow.tabs.${tab.key}`)}
        </NavLink>
      ))}
    </nav>
  );
}
