import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@operoz/i18n";
import type { THomeWidgetKeys, THomeWidgetProps } from "@operoz/types";
// assets
import darkWidgetsAsset from "@/app/assets/empty-state/dashboard/widgets-dark.webp?url";
import lightWidgetsAsset from "@/app/assets/empty-state/dashboard/widgets-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useHome } from "@/hooks/store/use-home";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { HomePageHeader } from "@/plane-web/components/home/header";
// local imports
import { StickiesWidget } from "../stickies/widget";
import { HomeLoader, NoProjectsEmptyState, RecentActivityWidget } from "./widgets";
import { ActiveCyclesWidget } from "./widgets/active-cycles";
import { DaySummaryWidget } from "./widgets/day-summary";
import { DraftsWidget } from "./widgets/drafts";
import { FavoriteProjectsWidget } from "./widgets/favorite-projects";
import { HomeShortcutsWidget } from "./widgets/home-shortcuts";
import { DashboardQuickLinks } from "./widgets/links";
import { ManageWidgetsModal } from "./widgets/manage";
import { MyWorkWidget } from "./widgets/my-work";
import { NewAtPlaneWidget } from "./widgets/new-at-plane";
import { NotificationsWidget } from "./widgets/notifications";
import { QuickTutorialWidget } from "./widgets/quick-tutorial";

export const HOME_WIDGETS_LIST: {
  [key in THomeWidgetKeys]: {
    component: React.FC<THomeWidgetProps> | null;
    fullWidth: boolean;
    title: string;
  };
} = {
  home_shortcuts: {
    component: HomeShortcutsWidget,
    fullWidth: true,
    title: "home.shortcuts.title",
  },
  day_summary: {
    component: DaySummaryWidget,
    fullWidth: true,
    title: "home.summary.title",
  },
  my_work: {
    component: MyWorkWidget,
    fullWidth: true,
    title: "home.my_work.title",
  },
  favorite_projects: {
    component: FavoriteProjectsWidget,
    fullWidth: false,
    title: "home.favorite_projects.title",
  },
  quick_links: {
    component: DashboardQuickLinks,
    fullWidth: false,
    title: "home.quick_links.title_plural",
  },
  recents: {
    component: RecentActivityWidget,
    fullWidth: true,
    title: "home.recents.title",
  },
  active_cycles: {
    component: ActiveCyclesWidget,
    fullWidth: false,
    title: "home.active_cycles.title",
  },
  notifications: {
    component: NotificationsWidget,
    fullWidth: true,
    title: "home.notifications.title",
  },
  drafts: {
    component: DraftsWidget,
    fullWidth: false,
    title: "home.drafts.title",
  },
  my_stickies: {
    component: StickiesWidget,
    fullWidth: true,
    title: "stickies.title",
  },
  new_at_plane: {
    component: NewAtPlaneWidget,
    fullWidth: false,
    title: "home.new_at_plane.title",
  },
  quick_tutorial: {
    component: QuickTutorialWidget,
    fullWidth: false,
    title: "home.quick_tutorial.title",
  },
};

function renderWidgetGrid(widgetNodes: ReactNode[], gridKey: string) {
  if (widgetNodes.length === 0) return null;

  const colsClass = widgetNodes.length >= 3 ? "md:grid-cols-3" : widgetNodes.length === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div key={gridKey} className={`grid grid-cols-1 gap-4 py-4 ${colsClass}`}>
      {widgetNodes}
    </div>
  );
}

export const DashboardWidgets = observer(function DashboardWidgets() {
  // router
  const { workspaceSlug } = useParams();
  // navigation
  const pathname = usePathname();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { toggleWidgetSettings, widgetsMap, showWidgetSettings, orderedWidgets, isAnyWidgetEnabled, loading } =
    useHome();
  const { loader } = useProject();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const noWidgetsResolvedPath = resolvedTheme === "light" ? lightWidgetsAsset : darkWidgetsAsset;

  // derived values
  const isWikiApp = pathname.includes(`/${workspaceSlug?.toString()}/pages`);
  if (!workspaceSlug) return null;
  if (loading || loader !== "loaded") return <HomeLoader />;

  const enabledWidgetNodes: ReactNode[] = [];
  const halfWidthBatch: ReactNode[] = [];
  const halfWidthBatchKeys: THomeWidgetKeys[] = [];

  const flushHalfWidthBatch = () => {
    if (halfWidthBatch.length === 0) return;
    enabledWidgetNodes.push(renderWidgetGrid([...halfWidthBatch], halfWidthBatchKeys.join("-")));
    halfWidthBatch.length = 0;
    halfWidthBatchKeys.length = 0;
  };

  orderedWidgets.forEach((key) => {
    const widgetConfig = HOME_WIDGETS_LIST[key];
    const WidgetComponent = widgetConfig?.component;
    const isEnabled = widgetsMap[key]?.is_enabled;

    if (!WidgetComponent || !isEnabled) return;

    const widgetElement = (
      <div key={key} className="min-w-0">
        <WidgetComponent workspaceSlug={workspaceSlug.toString()} />
      </div>
    );

    if (widgetConfig.fullWidth) {
      flushHalfWidthBatch();
      enabledWidgetNodes.push(
        <div key={key} className="py-4">
          {widgetElement}
        </div>
      );
    } else {
      halfWidthBatch.push(widgetElement);
      halfWidthBatchKeys.push(key);
    }
  });

  flushHalfWidthBatch();

  return (
    <div className="relative flex h-full w-full flex-col gap-7">
      <HomePageHeader />
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />
      {!isWikiApp && <NoProjectsEmptyState />}

      {isAnyWidgetEnabled ? (
        <div className="flex flex-col">{enabledWidgetNodes}</div>
      ) : (
        <div className="grid h-full w-full place-items-center gap-4">
          <SimpleEmptyState
            title={t("home.empty.widgets.title")}
            description={t("home.empty.widgets.description")}
            assetPath={noWidgetsResolvedPath}
          />
          <button
            type="button"
            onClick={() => toggleWidgetSettings(true)}
            className="hover:bg-accent-secondary rounded-md bg-accent-primary px-4 py-2 text-13 font-medium text-on-color"
          >
            {t("home.empty.widgets.primary_button.text")}
          </button>
        </div>
      )}
    </div>
  );
});
