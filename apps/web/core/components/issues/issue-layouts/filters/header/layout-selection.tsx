// plane imports
import { ISSUE_LAYOUTS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import type { EIssueLayoutTypes } from "@operis/types";
import { cn } from "@operis/utils";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  layouts: EIssueLayoutTypes[];
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes | undefined;
};

export function LayoutSelection(props: Props) {
  const { layouts, onChange, selectedLayout } = props;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const hasBoardWallpaper = useBoardHubHasBackground();
  const handleOnChange = (layoutKey: EIssueLayoutTypes) => {
    if (selectedLayout !== layoutKey) {
      onChange(layoutKey);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md p-0.5",
        hasBoardWallpaper ? "bg-layer-2/80" : "gap-1 bg-layer-3 p-1"
      )}
    >
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <Tooltip key={layout.key} tooltipContent={t(layout.i18n_title)} isMobile={isMobile}>
          <button
            type="button"
            className={cn(
              "group grid h-5.5 w-7 place-items-center overflow-hidden rounded-sm transition-all hover:bg-layer-transparent-hover",
              {
                "bg-layer-transparent-active hover:bg-layer-transparent-active": selectedLayout === layout.key,
              }
            )}
            onClick={() => handleOnChange(layout.key)}
          >
            <IssueLayoutIcon
              layout={layout.key}
              size={14}
              strokeWidth={2}
              className={`size-3.5 ${selectedLayout == layout.key ? "text-primary" : "text-secondary"}`}
            />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
