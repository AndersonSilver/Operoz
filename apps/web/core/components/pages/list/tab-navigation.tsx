import Link from "next/link";
import { useTranslation } from "@operis/i18n";
// types
import type { TPageNavigationTabs } from "@operis/types";
// helpers
import { cn } from "@operis/utils";

type TPageTabNavigation = {
  workspaceSlug: string;
  projectId: string;
  pageType: TPageNavigationTabs;
};

export function PageTabNavigation(props: TPageTabNavigation) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId, pageType } = props;

  const pageTabs: { key: TPageNavigationTabs; label: string }[] = [
    { key: "public", label: t("project_page.tabs.public") },
    { key: "private", label: t("project_page.tabs.private") },
    { key: "archived", label: t("project_page.tabs.archived") },
  ];

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, tabKey: TPageNavigationTabs) => {
    if (tabKey === pageType) e.preventDefault();
  };

  return (
    <div className="relative flex h-full items-center">
      {pageTabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/${workspaceSlug}/projects/${projectId}/pages?type=${tab.key}`}
          onClick={(e) => handleTabClick(e, tab.key)}
          className="flex h-full flex-col"
        >
          <div
            className={cn(`flex flex-1 items-center justify-center px-4 text-13 font-medium transition-all`, {
              "text-accent-primary": tab.key === pageType,
            })}
          >
            {tab.label}
          </div>
          <div
            className={cn(`w-full rounded-t border-t-2 border-transparent transition-all`, {
              "border-accent-strong": tab.key === pageType,
            })}
          />
        </Link>
      ))}
    </div>
  );
}
