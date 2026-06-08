// plane imports
import { ScrollArea } from "@operis/propel/scrollarea";
import { cn } from "@operis/utils";
// components
import { AppHeader } from "@/components/core/app-header";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  hugging?: boolean;
  /** Preenche a área útil sem scroll da página — para editores full-height (ex.: canvas de automação). */
  embedded?: boolean;
};

export function SettingsContentWrapper(props: Props) {
  const { children, header, hugging = false, embedded = false } = props;

  return (
    <div className="@container flex size-full grow flex-col overflow-hidden">
      {header && (
        <div className="w-full shrink-0">
          <AppHeader header={header} />
        </div>
      )}
      <ScrollArea
        scrollType="hover"
        orientation="vertical"
        size="sm"
        className={cn("size-full grow", embedded ? "overflow-hidden" : "overflow-y-scroll")}
        viewportClassName={embedded ? "!overflow-hidden" : undefined}
      >
        <div
          className={cn({
            "flex h-full min-h-0 flex-col pt-4 pb-5 lg:pt-5 lg:pb-6": embedded,
            "py-9": !embedded,
            "w-full px-page-x lg:px-12": hugging,
            "mx-auto w-full max-w-225 px-page-x @min-[58.95rem]:px-0": !hugging, // 58.95rem = max-width(56.25rem) + padding-x(1.35rem * 2)
          })}
        >
          {children}
        </div>
      </ScrollArea>
    </div>
  );
}
