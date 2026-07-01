import type { ReactNode } from "react";
import { cn } from "@operoz/utils";

type TSidebarPropertyListItemProps = {
  icon?: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  className?: string;
  childrenClassName?: string;
  /** Vertical label + value (compound fields like labels or due date alerts). */
  layout?: "inline" | "stacked";
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, className, childrenClassName, layout = "inline" } = props;

  const labelContent = (
    <>
      {Icon && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-layer-2 text-tertiary transition-colors group-hover/row:bg-layer-3">
          <Icon className="size-3" />
        </span>
      )}
      <span className="truncate text-10 font-semibold tracking-[0.12em] text-tertiary uppercase">{label}</span>
      {appendElement}
    </>
  );

  const valueContent = (
    <div
      className={cn(
        "min-w-0 rounded-md border border-transparent px-2 py-1 transition-[background-color,border-color] duration-150",
        "group-hover/row:border-subtle-1 group-hover/row:bg-layer-2/50",
        "group-focus-within/row:border-subtle group-focus-within/row:bg-layer-2/60",
        layout === "inline" ? "flex-1" : "w-full",
        childrenClassName
      )}
    >
      {children}
    </div>
  );

  if (layout === "stacked") {
    return (
      <div
        className={cn(
          "group/row flex flex-col gap-1.5 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-layer-transparent-hover",
          className
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">{labelContent}</div>
        {valueContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/row flex min-h-9 items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-layer-transparent-hover",
        className
      )}
    >
      <div className="flex w-[38%] max-w-[9.5rem] min-w-[6.5rem] shrink-0 items-center gap-1.5 pt-1">
        {labelContent}
      </div>
      {valueContent}
    </div>
  );
}
