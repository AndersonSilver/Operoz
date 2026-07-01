export { SidebarPropertyListItem as IssueDetailPropertyRow } from "@/components/common/layout/sidebar/property-list-item";

import { useState, type ReactNode } from "react";

/** Shared dropdown styling for inline property values (sidebar + peek). */
export const issueDetailPropertyDropdownProps = {
  buttonVariant: "transparent-with-text" as const,
  className: "group w-full",
  buttonContainerClassName: "w-full text-left",
  buttonClassName: "h-auto min-h-0 justify-start px-0 py-0.5 text-13 text-primary",
};
import { ChevronDownIcon } from "@operoz/propel/icons";
import { Collapsible } from "@operoz/ui";
import { cn } from "@operoz/utils";

type IssueDetailSidebarAccordionProps = {
  title: string;
  icon?: React.FC<{ className?: string }>;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function IssueDetailSidebarAccordion(props: IssueDetailSidebarAccordionProps) {
  const { title, icon: Icon, children, defaultOpen = true, className } = props;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "group/acc shadow-sm hover:shadow overflow-hidden rounded-xl border border-subtle bg-surface-1 transition-shadow duration-200",
        className
      )}
    >
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
        buttonClassName="w-full border-0 bg-transparent px-3.5 py-3 text-left transition-colors hover:bg-layer-transparent-hover"
        title={
          <div className="flex w-full items-center gap-2">
            {Icon && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-layer-2 text-tertiary">
                <Icon className="size-3" />
              </span>
            )}
            <span className="tracking-wider text-11 font-semibold text-secondary uppercase">{title}</span>
            <ChevronDownIcon
              className={cn(
                "ml-auto size-3.5 shrink-0 text-tertiary transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              strokeWidth={2.25}
            />
          </div>
        }
      >
        <div className="border-t border-subtle px-0 py-0">{children}</div>
      </Collapsible>
    </div>
  );
}

type IssueDetailPropertyGroupProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  withTopBorder?: boolean;
};

/** Optional in-accordion subgroup label (denser Jira-style blocks). */
export function IssueDetailPropertyGroup(props: IssueDetailPropertyGroupProps) {
  const { title, children, className, withTopBorder = false } = props;

  return (
    <div className={cn(withTopBorder && "border-t border-subtle", className)}>
      {title ? (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
          <span className="text-9 font-bold tracking-[0.18em] text-tertiary uppercase">{title}</span>
          <div className="flex-1 border-t border-subtle" />
        </div>
      ) : null}
      <div className="flex flex-col px-2 pb-2">{children}</div>
    </div>
  );
}
