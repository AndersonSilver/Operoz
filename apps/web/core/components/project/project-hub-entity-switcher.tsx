import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import type { ICustomSearchSelectOption } from "@operoz/types";
import { CustomSearchSelect } from "@operoz/ui";
import { cn } from "@operoz/utils";

type ProjectHubEntitySwitcherProps = {
  value: string;
  options: ICustomSearchSelectOption[];
  onChange: (value: string) => void;
  tooltip?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

export function ProjectHubEntitySwitcher(props: ProjectHubEntitySwitcherProps) {
  const { value, options, onChange, tooltip, searchPlaceholder, disabled, className } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const resolvedSearchPlaceholder = searchPlaceholder ?? t("common.search.label");

  const trigger = (
    <span
      className={cn(
        "shadow-sm inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-subtle/50 bg-layer-1/60 text-tertiary backdrop-blur-sm transition-colors",
        "hover:border-subtle hover:bg-layer-1 hover:text-primary",
        isOpen && "border-subtle bg-layer-1 text-primary",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      aria-hidden
    >
      <ChevronDown className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
    </span>
  );

  return (
    <CustomSearchSelect
      appearance="hub"
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placement="bottom-start"
      maxHeight="lg"
      searchPlaceholder={resolvedSearchPlaceholder}
      noResultsMessage={t("common.search.no_matches_found")}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      className="shrink-0"
      customButtonClassName="!h-auto !w-auto shrink-0 border-0 bg-transparent p-0 hover:bg-transparent"
      customButton={
        tooltip ? (
          <Tooltip tooltipContent={tooltip} position="bottom">
            {trigger}
          </Tooltip>
        ) : (
          trigger
        )
      }
    />
  );
}
