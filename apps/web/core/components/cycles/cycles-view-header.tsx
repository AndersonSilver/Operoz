import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { useOutsideClickDetector } from "@operoz/hooks";
import { IconButton } from "@operoz/propel/icon-button";
import { useTranslation } from "@operoz/i18n";
import { SearchIcon, CloseIcon } from "@operoz/propel/icons";
import type { TCycleFilters } from "@operoz/types";
import { cn, calculateTotalFilters } from "@operoz/utils";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import {
  ProjectHubToolbar,
  ProjectHubToolbarDivider,
  ProjectHubToolbarSegment,
} from "@/components/project/project-hub-toolbar";
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
import { CycleFiltersSelection } from "./dropdowns";

type Props = {
  projectId: string;
  trailing?: ReactNode;
};

export const CyclesViewHeader = observer(function CyclesViewHeader(props: Props) {
  const { projectId, trailing } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentProjectFilters, searchQuery, updateFilters, updateSearchQuery } = useCycleFilter();
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "");

  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery?.trim()) updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  const isFiltersApplied = calculateTotalFilters(currentProjectFilters ?? {}) !== 0;

  useEffect(() => {
    if (searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [searchQuery]);

  return (
    <ProjectHubToolbar className="hidden sm:inline-flex">
      <ProjectHubToolbarSegment>
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
        <FiltersDropdown
          icon={<ListFilter className="size-3.5" strokeWidth={1.75} />}
          title={t("common.filters")}
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
          appearance="hub"
        >
          <CycleFiltersSelection filters={currentProjectFilters ?? {}} handleFiltersUpdate={handleFilters} />
        </FiltersDropdown>
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
