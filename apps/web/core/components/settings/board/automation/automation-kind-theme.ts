export type AutomationVisualKind = "trigger" | "filter" | "action" | "decision" | "parallel";

export const AUTOMATION_KIND_THEME: Record<
  AutomationVisualKind,
  {
    accentBar: string;
    iconWrap: string;
    iconColor: string;
    chip: string;
    dot: string;
    border: string;
  }
> = {
  trigger: {
    accentBar: "bg-accent-primary",
    iconWrap: "bg-accent-subtle",
    iconColor: "text-accent-primary",
    chip: "bg-accent-subtle text-accent-primary",
    dot: "bg-accent-primary",
    border: "border-accent-subtle",
  },
  filter: {
    accentBar: "bg-warning-primary",
    iconWrap: "bg-warning-subtle",
    iconColor: "text-warning-primary",
    chip: "bg-warning-subtle text-warning-primary",
    dot: "bg-warning-primary",
    border: "border-warning-subtle",
  },
  action: {
    accentBar: "bg-success-primary",
    iconWrap: "bg-success-subtle",
    iconColor: "text-success-primary",
    chip: "bg-success-subtle text-success-primary",
    dot: "bg-success-primary",
    border: "border-success-subtle",
  },
  decision: {
    accentBar: "bg-[var(--extended-color-purple-500)]",
    iconWrap: "bg-[var(--extended-color-purple-500)]/15",
    iconColor: "text-[var(--extended-color-purple-500)]",
    chip: "bg-[var(--extended-color-purple-500)]/15 text-[var(--extended-color-purple-500)]",
    dot: "bg-[var(--extended-color-purple-500)]",
    border: "border-[var(--extended-color-purple-500)]/30",
  },
  parallel: {
    accentBar: "bg-[var(--extended-color-cyan-500)]",
    iconWrap: "bg-[var(--extended-color-cyan-500)]/15",
    iconColor: "text-[var(--extended-color-cyan-500)]",
    chip: "bg-[var(--extended-color-cyan-500)]/15 text-[var(--extended-color-cyan-500)]",
    dot: "bg-[var(--extended-color-cyan-500)]",
    border: "border-[var(--extended-color-cyan-500)]/30",
  },
};

/** Posição vertical (%) dos handles de ramo na borda direita do nó. */
export function branchHandleTopPercent(index: number, total: number, headerRatio = 0.42): string {
  const section = 1 - headerRatio;
  const pct = (headerRatio + (section * (index + 0.5)) / total) * 100;
  return `${pct}%`;
}
