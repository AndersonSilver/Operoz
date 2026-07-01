import type { TModuleStatus, TModuleGanttBarColorMode } from "../module/modules";

/** Módulo agregado no board (resposta de GET …/boards/{slug}/modules/). */
export interface IBoardModule {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  start_date: string | null;
  target_date: string | null;
  status: TModuleStatus | null;
  sort_order: number;
  archived_at: string | null;
  gantt_bar_color_mode?: TModuleGanttBarColorMode;
  gantt_bar_custom_color?: string;
}
