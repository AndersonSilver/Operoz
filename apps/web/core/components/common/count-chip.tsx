import { forwardRef } from "react";
import { cn } from "@operoz/utils";

type TCountChip = {
  count: string | number;
  className?: string;
};

export const CountChip = forwardRef<HTMLDivElement, TCountChip>(function CountChip(props, ref) {
  const { count, className = "" } = props;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center rounded-xl bg-accent-primary/20 px-2.5 py-0.5 text-caption-sm-semibold text-accent-primary",
        className
      )}
    >
      {count}
    </div>
  );
});

CountChip.displayName = "CountChip";
