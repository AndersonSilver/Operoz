import { observer } from "mobx-react";
// plane imports
import { IconButton } from "@operoz/propel/icon-button";
import { FilterIcon, FilterAppliedIcon } from "@operoz/propel/icons";
import { cn } from "@operoz/utils";
import type { IFilterInstance } from "@operoz/shared-state";
import type { TExternalFilter, TFilterProperty } from "@operoz/types";
// components
import { AddFilterButton } from "@/components/rich-filters/add-filters/button";
import { PROJECT_HUB_GHOST_BUTTON_CLASS } from "@/components/project/project-hub-toolbar";

type TFiltersToggleProps<P extends TFilterProperty, E extends TExternalFilter> = {
  filter: IFilterInstance<P, E> | undefined;
  appearance?: "default" | "hub";
};

const COMMON_CLASSNAME =
  "grid place-items-center h-7 w-full py-0.5 px-2 rounded-md border border-subtle-1 transition-all duration-200 cursor-pointer";

const HUB_ICON_CLASSNAME =
  "h-8 w-8 rounded-md border border-subtle/45 bg-layer-2/40 shadow-none hover:bg-layer-transparent-hover";

export const FiltersToggle = observer(function FiltersToggle<P extends TFilterProperty, E extends TExternalFilter>(
  props: TFiltersToggleProps<P, E>
) {
  const { filter, appearance = "default" } = props;
  const isHub = appearance === "hub";
  // derived values
  const hasAnyConditions = (filter?.allConditionsForDisplay.length ?? 0) > 0;
  const isFilterRowVisible = filter?.isVisible ?? false;
  const hasUpdates = filter?.canUpdateView === true && filter?.hasChanges === true;
  const showFilterRowChangesPill = hasUpdates || hasAnyConditions === true;
  const showAddFilterButton = !hasAnyConditions && !isFilterRowVisible && !hasUpdates;

  const handleToggleFilter = () => {
    if (!filter) {
      console.error("Filters toggle error - filter instance not available");
      return;
    }
    filter.toggleVisibility();
  };

  // Base classes when filter is active
  const activeFilterBaseClasses =
    "text-accent-primary border border-accent-subtle-1 hover:border-accent-subtle-1 active:border-accent-subtle-1 focus:border-accent-subtle-1";

  // State classes that prevent hover/active/focus color changes
  const noHoverStateClasses = "hover:text-accent-primary active:text-accent-primary focus:text-accent-primary";

  // Background classes based on toggle state (darker when open, lighter when closed)
  const backgroundClasses = isFilterRowVisible
    ? "bg-accent-subtle-hover hover:bg-accent-subtle-hover active:bg-accent-subtle-hover focus:bg-accent-subtle-hover"
    : "bg-accent-subtle hover:bg-accent-subtle active:bg-accent-subtle focus:bg-accent-subtle";

  const buttonClassName = cn({
    [activeFilterBaseClasses]: showFilterRowChangesPill,
    [backgroundClasses]: showFilterRowChangesPill,
    [noHoverStateClasses]: showFilterRowChangesPill,
  });

  const iconClassName = cn({
    "text-accent-primary [&_path]:fill-current": showFilterRowChangesPill,
  });

  // Show the add filter button when there are no active conditions, the filter row is hidden, and no unsaved changes exist
  if (filter && showAddFilterButton) {
    return (
      <AddFilterButton
        filter={filter}
        buttonConfig={{
          variant: isHub ? "ghost" : "secondary",
          className: isHub ? cn(HUB_ICON_CLASSNAME, "px-2") : COMMON_CLASSNAME,
          label: null,
          size: isHub ? "sm" : "lg",
        }}
        onFilterSelect={() => filter?.toggleVisibility(true)}
      />
    );
  }

  return (
    <IconButton
      size={isHub ? "sm" : "lg"}
      variant={isHub ? "ghost" : "secondary"}
      icon={showFilterRowChangesPill ? FilterAppliedIcon : FilterIcon}
      onClick={handleToggleFilter}
      className={cn(
        isHub ? HUB_ICON_CLASSNAME : undefined,
        !isHub && buttonClassName,
        isHub && showFilterRowChangesPill && "border-accent-subtle bg-accent-subtle/40 text-accent-primary"
      )}
      iconClassName={iconClassName}
    />
  );
});
