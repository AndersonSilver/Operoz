import { ListFilter } from "lucide-react";
import { getButtonStyling } from "@operoz/propel/button";
import { useTranslation } from "@operoz/i18n";
// plane imports
import { ChevronDownIcon } from "@operoz/propel/icons";
import { cn } from "@operoz/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import useSize from "@/hooks/use-window-size";
// local imports
import { InboxIssueFilterSelection } from "./filters/filter-selection";
import { InboxIssueOrderByDropdown } from "./sorting/order-by";

const smallButton = <ListFilter className="size-3" />;

export function FiltersRoot() {
  const { t } = useTranslation();
  const windowSize = useSize();

  const largeButton = (
    <div className={cn(getButtonStyling("secondary", "base"), "px-2 text-tertiary")}>
      <ListFilter className="size-3" />
      <span>{t("common.filters")}</span>
      <ChevronDownIcon className="size-3" strokeWidth={2} />
    </div>
  );

  return (
    <div className="relative flex items-center gap-2">
      <div>
        <FiltersDropdown
          menuButton={windowSize[0] > 1280 ? largeButton : smallButton}
          title={t("common.filters")}
          placement="bottom-end"
          appearance="hub"
        >
          <InboxIssueFilterSelection />
        </FiltersDropdown>
      </div>
      <div>
        <InboxIssueOrderByDropdown />
      </div>
    </div>
  );
}
