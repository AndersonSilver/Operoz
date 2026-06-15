import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TGanttViews } from "@operis/types";
import { cn } from "@operis/utils";
import {
  FLOATING_CONTROLS_RIGHT_OF_ASSISTANT_FAB_PX,
  OPEROZ_ASSISTANT_FAB_BOTTOM_PX,
} from "@/constants/floating-ui-layout";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
import { VIEWS_LIST } from "../data";

type Props = {
  showToday: boolean;
  currentView: TGanttViews | null;
  isViewControlsCollapsed: boolean;
  onToday: () => void;
  onChartView: (view: TGanttViews) => void;
  onToggleCollapsed: () => void;
};

export function GanttChartFloatingViewControls(props: Props) {
  const { showToday, currentView, isViewControlsCollapsed, onToday, onChartView, onToggleCollapsed } = props;
  const { t } = useTranslation();
  const { isSelectionActive } = useMultipleSelectStore();

  if (isSelectionActive) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: `${OPEROZ_ASSISTANT_FAB_BOTTOM_PX}px`,
        right: `${FLOATING_CONTROLS_RIGHT_OF_ASSISTANT_FAB_PX}px`,
        zIndex: 35,
      }}
      className="shadow-lg flex items-center gap-0.5 rounded-lg border border-subtle bg-surface-1 px-2 py-1.5"
    >
      {!isViewControlsCollapsed && (
        <>
          {showToday && (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-11 font-medium text-secondary hover:bg-layer-transparent-hover"
              onClick={onToday}
            >
              {t("common.today")}
            </button>
          )}
          {showToday && <div className="bg-subtle mx-1 h-4 w-px" />}
          {VIEWS_LIST.map((chartView: { key: TGanttViews; i18n_title: string }) => (
            <button
              key={chartView.key}
              type="button"
              className={cn(
                "rounded-md px-2 py-1 text-11 font-medium transition-colors",
                currentView === chartView.key
                  ? "bg-accent-primary text-on-color"
                  : "text-secondary hover:bg-layer-transparent-hover"
              )}
              onClick={() => onChartView(chartView.key)}
            >
              {t(chartView.i18n_title)}
            </button>
          ))}
          <div className="bg-subtle mx-1 h-4 w-px" />
        </>
      )}
      <button
        type="button"
        title={isViewControlsCollapsed ? "Expandir controles" : "Recolher controles"}
        className="flex items-center justify-center rounded-md p-1 text-secondary transition-all hover:bg-layer-transparent-hover"
        onClick={onToggleCollapsed}
      >
        {isViewControlsCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </div>,
    document.body
  );
}
