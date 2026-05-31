import type { LucideIcon } from "lucide-react";
import { Calendar, GanttChart, Kanban, LayoutDashboard, LayoutList, ListTodo, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { BOARD_HUB_IMMERSIVE_TEXT_SHADOW, BOARD_HUB_TAB_DIVIDER } from "@/components/board/board-hub-background";

export type BoardHubTabId = "overview" | "backlog" | "list" | "views" | "timeline" | "calendar" | "clientes";

type BoardHubTabDef = {
  id: BoardHubTabId;
  labelKey: string;
  icon: LucideIcon;
  href: (base: string) => string;
  isActive: (pathname: string) => boolean;
};

export function buildBoardHubTabs(workspaceSlug: string, boardSlug: string): BoardHubTabDef[] {
  const base = `/${workspaceSlug}/boards/${boardSlug}`;

  return [
    {
      id: "overview",
      labelKey: "boards.tab_overview",
      icon: LayoutDashboard,
      href: () => base,
      isActive: (pathname) =>
        pathname === base ||
        pathname === `${base}/` ||
        (!pathname.includes("/backlog") &&
          !pathname.includes("/list") &&
          !pathname.includes("/views") &&
          !pathname.includes("/timeline") &&
          !pathname.includes("/calendar") &&
          !pathname.includes("/clientes")),
    },
    {
      id: "backlog",
      labelKey: "boards.tab_backlog",
      icon: ListTodo,
      href: () => `${base}/backlog`,
      isActive: (pathname) => pathname.includes("/backlog"),
    },
    {
      id: "list",
      labelKey: "boards.tab_list",
      icon: LayoutList,
      href: () => `${base}/list`,
      isActive: (pathname) => pathname.includes("/list"),
    },
    {
      id: "views",
      labelKey: "boards.tab_board",
      icon: Kanban,
      href: () => `${base}/views`,
      isActive: (pathname) => pathname.includes("/views"),
    },
    {
      id: "timeline",
      labelKey: "boards.tab_timeline",
      icon: GanttChart,
      href: () => `${base}/timeline`,
      isActive: (pathname) => pathname.includes("/timeline"),
    },
    {
      id: "calendar",
      labelKey: "boards.tab_calendar",
      icon: Calendar,
      href: () => `${base}/calendar`,
      isActive: (pathname) => pathname.includes("/calendar"),
    },
    {
      id: "clientes",
      labelKey: "boards.tab_clients",
      icon: Users,
      href: () => `${base}/clientes`,
      isActive: (pathname) => pathname.includes("/clientes"),
    },
  ];
}

export function getActiveBoardHubTabLabel(
  tabs: BoardHubTabDef[],
  pathname: string,
  t: (key: string) => string,
  detailLabel?: string
): string {
  if (detailLabel) return detailLabel;
  const active = tabs.find((tab) => tab.isActive(pathname) && tab.id !== "overview");
  if (active) return t(active.labelKey);
  return t("boards.tab_overview");
}

type BoardHubTabNavProps = {
  workspaceSlug: string;
  boardSlug: string;
  pathname: string;
  className?: string;
  /** Abas sobre wallpaper (estilo Jira): sublinhado ativo, fundo translúcido no hover. */
  immersive?: boolean;
};

export function BoardHubTabNav({
  workspaceSlug,
  boardSlug,
  pathname,
  className,
  immersive = false,
}: BoardHubTabNavProps) {
  const { t } = useTranslation();
  const tabs = buildBoardHubTabs(workspaceSlug, boardSlug);

  return (
    <nav className={cn("relative w-full", immersive && "pb-4", className)}>
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;
          return (
            <BoardHubNavLink
              key={tab.id}
              to={tab.href(`/${workspaceSlug}/boards/${boardSlug}`)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 text-12 font-medium transition-colors",
                immersive && BOARD_HUB_IMMERSIVE_TEXT_SHADOW,
                immersive
                  ? cn(
                      "rounded-none border-b-2 border-transparent",
                      active
                        ? "border-white font-semibold text-white"
                        : "text-white hover:border-white/70 hover:text-white"
                    )
                  : cn(
                      "rounded-md",
                      active
                        ? "bg-layer-2 text-primary"
                        : "text-tertiary hover:bg-layer-transparent-hover hover:text-secondary"
                    )
              )}
            >
              <Icon
                className={cn("size-3.5 shrink-0", immersive ? "opacity-100" : "opacity-90")}
                strokeWidth={2}
                aria-hidden
              />
              {t(tab.labelKey)}
            </BoardHubNavLink>
          );
        })}
      </div>
      {immersive ? (
        <div
          className={cn(
            "pointer-events-none absolute bottom-0 left-1/2 max-w-full -translate-x-1/2",
            BOARD_HUB_TAB_DIVIDER,
            "w-[calc(100vw-2*var(--padding-page-x))]"
          )}
          aria-hidden
        />
      ) : null}
    </nav>
  );
}
