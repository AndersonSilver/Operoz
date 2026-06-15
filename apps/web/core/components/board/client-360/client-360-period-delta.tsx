import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@operis/utils";

export type Client360PeriodDeltaMode = "lower_is_better" | "higher_is_better";

type Props = {
  delta: number | null | undefined;
  mode?: Client360PeriodDeltaMode;
  className?: string;
};

function isImproved(delta: number, mode: Client360PeriodDeltaMode): boolean {
  if (delta === 0) return true;
  return mode === "lower_is_better" ? delta < 0 : delta > 0;
}

export function Client360PeriodDelta({ delta, mode = "lower_is_better", className }: Props) {
  if (delta == null) return null;

  if (delta === 0) {
    return <span className={cn("text-11 text-tertiary tabular-nums", className)}>0</span>;
  }

  const improved = isImproved(delta, mode);
  const Icon = delta > 0 ? ArrowUp : ArrowDown;
  const label = delta > 0 ? `+${delta}` : String(delta);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-11 font-medium tabular-nums",
        improved ? "text-success-primary" : "text-danger-primary",
        className
      )}
    >
      <Icon className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}
