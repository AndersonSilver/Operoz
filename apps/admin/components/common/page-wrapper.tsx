import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { cn } from "@operis/utils";
import { AdminListHero, type AdminHighlight } from "@/components/settings/admin-list-hero";

type TPageWrapperProps = {
  children: ReactNode;
  header?: {
    title: string;
    description: string | ReactNode;
    actions?: ReactNode;
    icon?: LucideIcon;
    highlights?: AdminHighlight[];
    accentClass?: string;
    gradientClass?: string;
  };
  customHeader?: ReactNode;
  /** @deprecated Layout is always full width; kept for call-site compatibility */
  size?: "lg" | "md";
};

export const PageWrapper = (props: TPageWrapperProps) => {
  const { children, header, customHeader } = props;

  return (
    <div className={cn("flex h-full w-full min-w-0 flex-col space-y-6 px-5 py-5 lg:px-8 xl:px-10")}>
      {customHeader ? (
        <div className="w-full shrink-0">{customHeader}</div>
      ) : (
        header &&
        (header.icon ? (
          <AdminListHero
            icon={header.icon}
            title={header.title}
            description={header.description}
            highlights={header.highlights}
            actions={header.actions}
            accentClass={header.accentClass}
            gradientClass={header.gradientClass}
          />
        ) : (
          <AdminListHero
            icon={Settings}
            title={header.title}
            description={header.description}
            actions={header.actions}
          />
        ))
      )}
      <div className="vertical-scrollbar scrollbar-sm min-h-0 w-full flex-1 overflow-y-auto pb-6">{children}</div>
    </div>
  );
};
