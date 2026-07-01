import { observer } from "mobx-react";
import { Expand, Shrink } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
// plane
import type { TGanttViews } from "@operoz/types";
import { Row } from "@operoz/ui";
// components
import { BOARD_HUB_GANTT_SURFACE, useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { cn } from "@operoz/utils";
//
import { GANTT_BREADCRUMBS_HEIGHT } from "../constants";

type Props = {
  blockIds: string[];
  fullScreenMode: boolean;
  handleChartView: (view: TGanttViews) => void;
  handleToday: () => void;
  loaderTitle: string;
  toggleFullScreenMode: () => void;
  showToday: boolean;
};

export const GanttChartHeader = observer(function GanttChartHeader(props: Props) {
  const { t } = useTranslation();
  const { blockIds, fullScreenMode, loaderTitle, toggleFullScreenMode } = props;
  const hasBoardWallpaper = useBoardHubHasBackground();

  return (
    <Row
      className={cn(
        "relative flex w-full flex-shrink-0 items-center gap-2 py-2 whitespace-nowrap",
        hasBoardWallpaper ? BOARD_HUB_GANTT_SURFACE : "bg-surface-1"
      )}
      style={{ height: `${GANTT_BREADCRUMBS_HEIGHT}px` }}
    >
      <div className="ml-auto text-11 font-medium text-tertiary">
        {blockIds ? `${blockIds.length} ${loaderTitle}` : t("common.loading")}
      </div>
      <button
        type="button"
        className="flex items-center justify-center rounded-md border border-subtle bg-layer-transparent p-1 transition-all hover:bg-layer-transparent-hover"
        onClick={toggleFullScreenMode}
      >
        {fullScreenMode ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
      </button>
    </Row>
  );
});
