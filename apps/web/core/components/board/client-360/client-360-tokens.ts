/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Cores só em ícones / pontos / barras finas — fundos da UI permanecem neutros. */
export type Client360Tone = "accent" | "neutral" | "success" | "warning" | "danger" | "info";

export const CLIENT_360_TONE: Record<
  Client360Tone,
  { icon: string; iconBg: string; bar: string; dot: string }
> = {
  accent: {
    icon: "text-accent-primary",
    iconBg: "bg-accent-primary/12",
    bar: "var(--text-color-accent-primary)",
    dot: "bg-accent-primary",
  },
  neutral: {
    icon: "text-tertiary",
    iconBg: "bg-layer-2",
    bar: "var(--text-color-tertiary)",
    dot: "bg-tertiary",
  },
  success: {
    icon: "text-success-primary",
    iconBg: "bg-success-subtle/40",
    bar: "var(--background-color-success-primary)",
    dot: "bg-success-primary",
  },
  warning: {
    icon: "text-warning-primary",
    iconBg: "bg-warning-subtle/40",
    bar: "var(--background-color-warning-primary)",
    dot: "bg-warning-primary",
  },
  danger: {
    icon: "text-danger-primary",
    iconBg: "bg-danger-subtle/40",
    bar: "var(--background-color-danger-primary)",
    dot: "bg-danger-primary",
  },
  info: {
    icon: "text-accent-primary",
    iconBg: "bg-accent-primary/10",
    bar: "var(--text-color-accent-primary)",
    dot: "bg-accent-primary",
  },
};
