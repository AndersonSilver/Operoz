/** Tokens de tom para pontos e barras de dados. Vieram do Cliente 360, que foi
 * removido; sao genericos e seguem em uso pelo overview de board. */
export type ToneKey = "accent" | "neutral" | "success" | "warning" | "danger" | "info";

export const TONE_TOKENS: Record<ToneKey, { icon: string; iconBg: string; bar: string; dot: string }> = {
  accent: {
    icon: "text-secondary",
    iconBg: "bg-layer-2",
    bar: "var(--text-color-tertiary)",
    dot: "bg-accent-primary/70",
  },
  neutral: {
    icon: "text-tertiary",
    iconBg: "bg-layer-2",
    bar: "var(--text-color-tertiary)",
    dot: "bg-tertiary",
  },
  success: {
    icon: "text-secondary",
    iconBg: "bg-layer-2",
    bar: "var(--background-color-success-primary)",
    dot: "bg-success-primary/70",
  },
  warning: {
    icon: "text-secondary",
    iconBg: "bg-layer-2",
    bar: "var(--background-color-warning-primary)",
    dot: "bg-warning-primary/70",
  },
  danger: {
    icon: "text-secondary",
    iconBg: "bg-layer-2",
    bar: "var(--background-color-danger-primary)",
    dot: "bg-danger-primary/70",
  },
  info: {
    icon: "text-secondary",
    iconBg: "bg-layer-2",
    bar: "var(--text-color-tertiary)",
    dot: "bg-accent-primary/70",
  },
};
