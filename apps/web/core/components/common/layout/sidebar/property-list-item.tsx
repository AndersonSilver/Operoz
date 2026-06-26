import type { ReactNode } from "react";
import { cn } from "@operis/utils";

type TSidebarPropertyListItemProps = {
  icon?: React.FC<{ className?: string }>;
  label: string;
  children: ReactNode;
  appendElement?: ReactNode;
  className?: string;
  childrenClassName?: string;
};

export function SidebarPropertyListItem(props: TSidebarPropertyListItemProps) {
  const { icon: Icon, label, children, appendElement, className, childrenClassName } = props;

  return (
    <div
      className={cn(
        "group/row flex flex-col gap-1 rounded-lg px-2.5 py-2 transition-colors duration-150 hover:bg-layer-transparent-hover",
        className
      )}
    >
      <div className="tracking-widest flex items-center gap-1.5 text-10 font-semibold text-tertiary uppercase">
        {Icon && <Icon className="size-3 shrink-0 text-tertiary/70 transition-colors group-hover/row:text-tertiary" />}
        <span>{label}</span>
        {appendElement}
      </div>
      <div className={cn("min-w-0 pl-[1.125rem]", childrenClassName)}>{children}</div>
    </div>
  );
}
