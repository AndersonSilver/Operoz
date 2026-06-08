import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { ListFilter } from "lucide-react";
import { useOutsideClickDetector } from "@operis/hooks";
import { SearchIcon, CloseIcon } from "@operis/propel/icons";
// plane helpers
// helpers
import { cn } from "@operis/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useTranslation } from "@operis/i18n";
import { FiltersDropdown } from "../issues/issue-layouts/filters";
import { ViewFiltersSelection } from "./filters/filter-selection";
import { ViewOrderByDropdown } from "./filters/order-by";
import { IconButton } from "@operis/propel/icon-button";

export const ViewListHeader = observer(function ViewListHeader() {
  const { t } = useTranslation();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (filters?.searchQuery && filters?.searchQuery.trim() !== "") {
        updateFilters("searchQuery", "");
      } else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && filters?.searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (filters?.searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [filters?.searchQuery]);

  return (
    <div className="flex h-full items-center gap-1.5">
      <div className="flex items-center">
        {!isSearchOpen && (
          <IconButton
            variant="ghost"
            size="sm"
            className="h-8 w-8 border border-subtle/50 bg-layer-1/50 shadow-sm"
            onClick={() => {
              setIsSearchOpen(true);
              inputRef.current?.focus();
            }}
            icon={SearchIcon}
          />
        )}
        <div
          className={cn(
            "ml-auto flex h-8 w-0 items-center justify-start gap-1 overflow-hidden rounded-md border border-transparent bg-layer-1/55 text-placeholder opacity-0 shadow-sm backdrop-blur-sm transition-[width] ease-linear",
            {
              "w-56 border-subtle/50 px-2.5 opacity-100": isSearchOpen,
            }
          )}
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            ref={inputRef}
            className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
            placeholder={t("common.search.label")}
            value={filters?.searchQuery}
            onChange={(e) => updateFilters("searchQuery", e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {isSearchOpen && (
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => {
                updateFilters("searchQuery", "");
                setIsSearchOpen(false);
              }}
            >
              <CloseIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <ViewOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<ListFilter className="size-3.5" strokeWidth={1.75} />}
          title={t("common.filters")}
          placement="bottom-end"
          isFiltersApplied={false}
          appearance="hub"
        >
          <ViewFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={projectMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
