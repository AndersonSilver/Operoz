import type { ReactNode } from "react";
import { cn } from "@operoz/utils";
import { SIDEBAR_SECTION_LABEL_CLASS } from "./sidebar-styles";

type Props = {
  label: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  actions?: ReactNode;
  className?: string;
  toggleAriaLabel?: string;
};

export function SidebarSectionHeader(props: Props) {
  const { label, isOpen, onToggle, actions, className, toggleAriaLabel } = props;

  return (
    <div
      className={cn(
        "group/section flex w-full items-center justify-between gap-1 px-1 pt-3 pb-1 first:pt-1",
        className
      )}
    >
      {onToggle ? (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={toggleAriaLabel}
        >
          <span className={cn(SIDEBAR_SECTION_LABEL_CLASS, "truncate")}>{label}</span>
        </button>
      ) : (
        <span className={cn(SIDEBAR_SECTION_LABEL_CLASS, "truncate px-0.5")}>{label}</span>
      )}
      {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </div>
  );
}
