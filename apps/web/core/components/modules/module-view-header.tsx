import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
// plane helpers
import { MODULE_VIEW_LAYOUTS } from "@operoz/constants";
import { useOutsideClickDetector } from "@operoz/hooks";
// types
import { useTranslation } from "@operoz/i18n";
import { SearchIcon, CloseIcon } from "@operoz/propel/icons";
import { Tooltip } from "@operoz/propel/tooltip";
import type { TModuleFilters } from "@operoz/types";
// ui
import { cn, calculateTotalFilters } from "@operoz/utils";
// plane utils
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { ModuleFiltersSelection, ModuleOrderByDropdown } from "@/components/modules/dropdowns";
// constants
// helpers
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";
import {
  PROJECT_HUB_LAYOUT_TOGGLE_GROUP,
  ProjectHubToolbar,
  ProjectHubToolbarDivider,
  ProjectHubToolbarSegment,
} from "@/components/project/project-hub-toolbar";
import { ModuleLayoutIcon } from "./module-layout-icon";
import { IconButton } from "@operoz/propel/icon-button";
type ModuleViewHeaderProps = {
  trailing?: ReactNode;
};

export const ModuleViewHeader = observer(function ModuleViewHeader(props: ModuleViewHeaderProps) {
  const { trailing } = props;
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // router
  const { projectId } = useParams();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const {
    currentProjectDisplayFilters: displayFilters,
    currentProjectFilters: filters,
    searchQuery,
    updateDisplayFilters,
    updateFilters,
    updateSearchQuery,
  } = useModuleFilter();
  const { t } = useTranslation();

  // states
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "" ? true : false);

  // handlers
  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [filters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0 || displayFilters?.favorites;

  return (
    <ProjectHubToolbar className="hidden sm:inline-flex">
      <ProjectHubToolbarSegment>
        <div className="flex items-center">
          {!isSearchOpen ? (
            <IconButton
              variant="ghost"
              size="sm"
              className="h-8 w-8 border-0 bg-transparent shadow-none hover:bg-layer-transparent-hover"
              onClick={() => {
                setIsSearchOpen(true);
                inputRef.current?.focus();
              }}
              icon={SearchIcon}
            />
          ) : (
            <div
              className={cn(
                "flex h-8 w-52 items-center gap-1.5 rounded-md border border-subtle/50 bg-layer-2/60 px-2.5",
                "transition-[width] ease-out"
              )}
            >
              <SearchIcon className="size-3.5 shrink-0 text-tertiary" />
              <input
                ref={inputRef}
                className="w-full border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
                placeholder={t("common.search.label")}
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
              />
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-primary"
                onClick={() => {
                  updateSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <CloseIcon className="size-3" />
              </button>
            </div>
          )}
        </div>
        <ModuleOrderByDropdown
          value={displayFilters?.order_by}
          onChange={(val) => {
            if (!projectId || val === displayFilters?.order_by) return;
            updateDisplayFilters(projectId.toString(), {
              order_by: val,
            });
          }}
        />
        <FiltersDropdown
          icon={<ListFilter className="size-3.5" strokeWidth={1.75} />}
          title={t("common.filters")}
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
          appearance="hub"
        >
          <ModuleFiltersSelection
            displayFilters={displayFilters ?? {}}
            filters={filters ?? {}}
            handleDisplayFiltersUpdate={(val) => {
              if (!projectId) return;
              updateDisplayFilters(projectId.toString(), val);
            }}
            handleFiltersUpdate={handleFilters}
            memberIds={workspaceMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </ProjectHubToolbarSegment>

      <ProjectHubToolbarDivider />

      <ProjectHubToolbarSegment className="hidden md:flex">
        <div className={PROJECT_HUB_LAYOUT_TOGGLE_GROUP}>
          {MODULE_VIEW_LAYOUTS.map((layout) => (
            <Tooltip key={layout.key} tooltipContent={t(layout.i18n_title)} isMobile={isMobile}>
              <button
                type="button"
                className={cn(
                  "group grid h-7 w-8 place-items-center overflow-hidden rounded-md transition-all hover:bg-layer-transparent-hover",
                  {
                    "shadow-sm bg-layer-transparent-active ring-1 ring-subtle/50 ring-inset hover:bg-layer-transparent-active":
                      displayFilters?.layout === layout.key,
                  }
                )}
                onClick={() => {
                  if (!projectId) return;
                  updateDisplayFilters(projectId.toString(), { layout: layout.key });
                }}
              >
                <ModuleLayoutIcon layoutType={layout.key} />
              </button>
            </Tooltip>
          ))}
        </div>
      </ProjectHubToolbarSegment>

      {trailing ? (
        <>
          <ProjectHubToolbarDivider />
          <ProjectHubToolbarSegment>{trailing}</ProjectHubToolbarSegment>
        </>
      ) : null}
    </ProjectHubToolbar>
  );
});
