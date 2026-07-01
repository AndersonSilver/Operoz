import type { IBoardModule, IModule, TModuleGanttBarColorMode } from "@operoz/types";

export const GANTT_BAR_FALLBACK_COLOR = "#6366F1";

export type TGanttBarColorSource = Pick<IModule, "gantt_bar_color_mode" | "gantt_bar_custom_color">;

export function resolveGanttBarColor(
  stateColor: string,
  moduleConfig?: TGanttBarColorSource | IBoardModule | null
): string {
  if (moduleConfig?.gantt_bar_color_mode === "custom" && moduleConfig.gantt_bar_custom_color) {
    return moduleConfig.gantt_bar_custom_color;
  }

  return stateColor || GANTT_BAR_FALLBACK_COLOR;
}

export const DEFAULT_MODULE_GANTT_BAR_COLOR_MODE: TModuleGanttBarColorMode = "state";

export const DEFAULT_MODULE_GANTT_BAR_CUSTOM_COLOR = GANTT_BAR_FALLBACK_COLOR;
