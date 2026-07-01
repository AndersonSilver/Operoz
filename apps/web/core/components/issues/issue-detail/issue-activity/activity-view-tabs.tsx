import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import { ACTIVITY_VIEW_TAB_I18N, ACTIVITY_VIEW_TAB_OPTIONS, type EActivityViewTab } from "./activity-view-tabs.config";

type Props = {
  activeTab: EActivityViewTab;
  onTabChange: (tab: EActivityViewTab) => void;
};

export const ActivityViewTabs = observer(function ActivityViewTabs(props: Props) {
  const { activeTab, onTabChange } = props;
  const { t } = useTranslation();

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      {ACTIVITY_VIEW_TAB_OPTIONS.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "rounded-md border bg-layer-2 px-3 py-1.5 text-12 font-medium transition-colors",
              isActive
                ? "border-accent-strong text-primary"
                : "border-subtle text-secondary hover:border-subtle-1 hover:text-primary"
            )}
          >
            {t(ACTIVITY_VIEW_TAB_I18N[tab])}
          </button>
        );
      })}
    </div>
  );
});
