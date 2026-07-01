import { ArrowRight, GitBranch, Play, Zap } from "lucide-react";
import { cn } from "@operoz/ui";

type Props = {
  triggerLabel?: string | null;
  stepCount?: number;
  actionCount?: number;
  decisionCount?: number;
  isActive?: boolean;
};

export function AutomationFlowStrip(props: Props) {
  const { triggerLabel, stepCount = 0, actionCount = 0, decisionCount = 0, isActive = true } = props;

  if (!triggerLabel && stepCount === 0) {
    return (
      <div
        className={cn(
          "automation-flow-strip-grid mt-4 rounded-lg border border-dashed border-subtle px-3 py-4 text-center text-11 text-placeholder"
        )}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={cn(
        "automation-flow-strip-grid relative mt-4 overflow-hidden rounded-lg border border-subtle px-2.5 py-2",
        isActive ? "bg-canvas/40" : "bg-layer-2/30"
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        {triggerLabel && (
          <span className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-accent-subtle/60 bg-accent-subtle/50 px-1.5 py-0.5 text-10 font-medium text-accent-primary">
            <Zap className="size-2.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{triggerLabel}</span>
          </span>
        )}

        {stepCount > 1 && (
          <>
            <ArrowRight className="size-3 shrink-0 text-placeholder" strokeWidth={1.75} />
            <span className="rounded-md bg-layer-2 px-1.5 py-0.5 text-10 font-medium text-tertiary">{stepCount}</span>
          </>
        )}

        {decisionCount > 0 && (
          <>
            <ArrowRight className="size-3 shrink-0 text-placeholder" strokeWidth={1.75} />
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[var(--extended-color-purple-500)]/10 px-1.5 py-0.5 text-10 font-medium text-[var(--extended-color-purple-500)]">
              <GitBranch className="size-2.5" strokeWidth={2} />
              {decisionCount}
            </span>
          </>
        )}

        {actionCount > 0 && (
          <>
            <ArrowRight className="size-3 shrink-0 text-placeholder" strokeWidth={1.75} />
            <span className="inline-flex items-center gap-0.5 rounded-md border border-success-subtle/50 bg-success-subtle/40 px-1.5 py-0.5 text-10 font-medium text-success-primary">
              <Play className="size-2.5" strokeWidth={2} />
              {actionCount}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
