// plane imports
import { ISSUE_LAYOUTS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import type { EIssueLayoutTypes } from "@operis/types";
import { cn } from "@operis/utils";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
import { PROJECT_HUB_LAYOUT_TOGGLE_GROUP } from "@/components/project/project-hub-toolbar";
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
  const handleOnChange = (layoutKey: EIssueLayoutTypes) => {
    if (selectedLayout !== layoutKey) {
      onChange(layoutKey);
    }
  };

  return (
    <div className={PROJECT_HUB_LAYOUT_TOGGLE_GROUP}>
      {ISSUE_LAYOUTS.filter((l) => layouts.includes(l.key)).map((layout) => (
        <Tooltip key={layout.key} tooltipContent={t(layout.i18n_title)} isMobile={isMobile}>
          <button
            type="button"
            className={cn(
              "group grid h-7 w-8 place-items-center overflow-hidden rounded-md transition-all hover:bg-layer-transparent-hover",
              {
                "bg-layer-transparent-active shadow-sm ring-1 ring-inset ring-subtle/50 hover:bg-layer-transparent-active":
                  selectedLayout === layout.key,
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
