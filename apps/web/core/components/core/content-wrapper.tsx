import type { ReactNode } from "react";
import { cn } from "@operoz/utils";

export interface ContentWrapperProps {
  className?: string;
  children: ReactNode;
}

export function ContentWrapper({ className, children }: ContentWrapperProps) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <div className={cn("relative h-full w-full overflow-x-hidden overflow-y-scroll", className)}>{children}</div>
    </div>
  );
}
