import { useMemo, useState, type ComponentType } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { ModuleIcon } from "@operis/propel/icons";
import type { ICustomSearchSelectOption, IModule } from "@operis/types";
import { CustomSearchSelect } from "@operis/ui";
import { cn } from "@operis/utils";
import { SwitcherLabel } from "@/components/common/switcher-label";

type ProjectHubModuleSearchSelectProps = {
  moduleIds: string[];
  getModuleById: (moduleId: string) => IModule | null | undefined;
  value: string[] | string;
  onChange: (moduleIds: string[] | string) => void;
  disabled?: boolean;
  className?: string;
  /** Compacto para a toolbar ao lado do layout. */
  variant?: "default" | "toolbar";
  multiple?: boolean;
  searchPlaceholder?: string;
  searchHint?: string;
  labelIcon?: ComponentType<{ className?: string }>;
};

export function ProjectHubModuleSearchSelect(props: ProjectHubModuleSearchSelectProps) {
  const {
    moduleIds,
    getModuleById,
    value,
    onChange,
    disabled,
    className,
    variant = "default",
    multiple = true,
    searchPlaceholder,
    searchHint,
    labelIcon: LabelIcon = ModuleIcon,
  } = props;
  const isToolbar = variant === "toolbar";
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo(
    () =>
      moduleIds
        .map((id): ICustomSearchSelectOption | null => {
          const module = getModuleById(id);
          if (!module) return null;
          return {
            value: module.id,
            query: module.name,
            content: <SwitcherLabel name={module.name} LabelIcon={LabelIcon} />,
          };
        })
        .filter((option): option is ICustomSearchSelectOption => option !== null),
    [getModuleById, moduleIds]
  );

  const selectedIds = useMemo(() => (Array.isArray(value) ? value : [value]), [value]);

  const selectedModules = useMemo(
    () => selectedIds.map((id) => getModuleById(id)).filter((module): module is IModule => Boolean(module)),
    [getModuleById, selectedIds]
  );

  const handleChange = (next: string | string[]) => {
    if (multiple) {
      const ids = Array.isArray(next) ? next : [next];
      if (ids.length === 0) return;
      onChange(ids);
      return;
    }
    if (typeof next === "string" && next) onChange(next);
  };

  const trigger = (
    <div
      className={cn(
        "flex w-full min-w-0 items-center text-left transition-colors",
        isToolbar
          ? "h-8 max-w-[14rem] gap-1.5 rounded-md border-0 bg-transparent px-2"
          : "min-h-10 gap-2.5 rounded-lg border border-subtle/55 bg-layer-1/75 px-3 py-2 shadow-sm backdrop-blur-md hover:border-subtle hover:bg-layer-1",
        !isToolbar && isOpen && "border-subtle bg-layer-1 ring-1 ring-accent-primary/25",
        isToolbar && isOpen && "bg-layer-transparent-hover",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <Search
        className={cn("shrink-0 text-placeholder", isToolbar ? "size-3.5" : "size-4")}
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {selectedModules.length === 0 ? (
          <span className="truncate text-13 text-placeholder">
            {searchPlaceholder ?? t("project_modules.detail.module_search_placeholder")}
          </span>
        ) : selectedModules.length === 1 ? (
          <span className={cn("min-w-0 truncate", isToolbar ? "text-13 text-secondary" : "")}>
            <SwitcherLabel name={selectedModules[0].name} LabelIcon={LabelIcon} />
          </span>
        ) : multiple ? (
          selectedModules.map((module) => (
            <span
              key={module.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-subtle/50 bg-layer-2/80 py-0.5 pr-1 pl-1.5 text-12 text-secondary",
                isToolbar ? "max-w-[5.5rem]" : "max-w-[11rem]"
              )}
            >
              <LabelIcon className="size-3 shrink-0 text-tertiary" />
              <span className="truncate">{module.name}</span>
              <button
                type="button"
                className="grid size-4 shrink-0 place-items-center rounded-sm text-placeholder hover:bg-layer-3 hover:text-primary"
                aria-label="Remover"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const next = selectedIds.filter((id) => id !== module.id);
                  if (next.length > 0) onChange(next);
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : null}
      </div>
      <ChevronDown
        className={cn("size-4 shrink-0 text-tertiary transition-transform duration-200", isOpen && "rotate-180")}
        aria-hidden
      />
    </div>
  );

  return (
    <CustomSearchSelect
      appearance="hub"
      multiple={multiple}
      options={options}
      value={value}
      onChange={handleChange}
      disabled={disabled || options.length === 0}
      placement="bottom-start"
      maxHeight="lg"
      searchPlaceholder={searchPlaceholder ?? t("project_modules.detail.module_search_placeholder")}
      noResultsMessage={t("common.search.no_matches_found")}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      className={cn(isToolbar ? "w-[14rem] shrink-0" : "w-full min-w-0 max-w-xl")}
      customButtonClassName="!h-auto !w-full min-w-0 border-0 bg-transparent p-0 hover:bg-transparent"
      customButton={trigger}
      footerOption={
        (searchHint ?? (multiple ? t("project_modules.detail.module_search_hint") : undefined)) ? (
          <p className="border-t border-subtle/40 px-3 pt-2 text-11 text-tertiary">
            {searchHint ?? t("project_modules.detail.module_search_hint")}
          </p>
        ) : null
      }
    />
  );
}
