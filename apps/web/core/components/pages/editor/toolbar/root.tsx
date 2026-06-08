import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
// plane imports
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";
import { BOARD_HUB_GLASS_BAR } from "@/components/board/board-hub-background";
import { PageToolbar } from "@/components/pages/editor/toolbar";
import { useProjectWorkSurface } from "@/components/project/project-view-shell";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { PageCollaboratorsList } from "@/plane-web/components/pages/header/collaborators-list";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  handleOpenNavigationPane: () => void;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
};

export const PageEditorToolbarRoot = observer(function PageEditorToolbarRoot(props: Props) {
  const { handleOpenNavigationPane, isNavigationPaneOpen, page } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const {
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, isStickyToolbarEnabled } = usePageFilters();
  // derived values
  const shouldHideToolbar = !isStickyToolbarEnabled || !isContentEditable;
  const insideWorkSurface = useProjectWorkSurface();

  return (
    <>
      <div
        id="page-toolbar-container"
        className={cn("max-h-[52px] overflow-auto transition-all duration-300 ease-linear", {
          "max-h-0 overflow-hidden": shouldHideToolbar,
        })}
      >
        <div
          className={cn(
            "page-toolbar-content relative hidden min-h-[52px] items-center border-b px-page-x transition-all duration-200 ease-in-out md:flex",
            insideWorkSurface && BOARD_HUB_GLASS_BAR,
            {
              "wide-layout": isFullWidth,
            }
          )}
        >
          <div className="flex w-full max-w-full items-center justify-between">
            <div className="flex-1">{editorRef && <PageToolbar editorRef={editorRef} />}</div>
            <div className="flex items-center gap-2">
              <PageCollaboratorsList page={page} />
              {!isNavigationPaneOpen && (
                <button
                  type="button"
                  className="grid size-6 shrink-0 place-items-center rounded-sm text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
                  onClick={handleOpenNavigationPane}
                >
                  <PanelRight className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {shouldHideToolbar && (
        <div className="absolute top-0 right-0 z-10 flex h-[52px] items-center px-page-x">
          {!isNavigationPaneOpen && (
            <Tooltip tooltipContent={t("page_navigation_pane.open_button")}>
              <button
                type="button"
                className="grid size-6 shrink-0 place-items-center rounded-sm text-secondary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
                onClick={handleOpenNavigationPane}
                aria-label={t("page_navigation_pane.open_button")}
              >
                <PanelRight className="size-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </>
  );
});
