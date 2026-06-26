import { CalendarDays } from "lucide-react";
import { cn } from "@operis/utils";
import { DateDropdown } from "@/components/dropdowns/date";

type ModuleListDateFieldProps = {
  value: string | null;
  placeholder: string;
  disabled: boolean;
  minDate?: Date;
  maxDate?: Date;
  onChange: (val: Date | null) => void;
};

export function ModuleListDateField(props: ModuleListDateFieldProps) {
  const { value, placeholder, disabled, minDate, maxDate, onChange } = props;
  const hasDate = Boolean(value && value.toString().trim() !== "");

  return (
    <DateDropdown
      className="group/date h-7 w-full min-w-[8.5rem]"
      buttonVariant="transparent-with-text"
      buttonContainerClassName={cn(
        "flex h-7 w-full items-center justify-center rounded-sm border px-2 transition-colors",
        hasDate
          ? "shadow-sm border-subtle bg-layer-1 text-primary hover:border-strong hover:bg-layer-1-hover"
          : "border-dashed border-subtle-1 bg-transparent text-placeholder hover:border-strong hover:bg-layer-transparent-hover",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
      buttonClassName="relative h-full w-full min-w-0 justify-center gap-1.5 px-0"
      labelClassName="grow-0 truncate text-center tabular-nums text-12 font-medium"
      formatToken="dd MMM yy"
      value={value}
      minDate={minDate}
      maxDate={maxDate}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      showTooltip
      icon={<CalendarDays className="size-3 shrink-0 text-tertiary" strokeWidth={1.75} />}
      clearIconClassName="absolute right-1.5 top-1/2 size-3 shrink-0 -translate-y-1/2 text-tertiary opacity-0 transition-opacity group-hover/date:opacity-100"
    />
  );
}
