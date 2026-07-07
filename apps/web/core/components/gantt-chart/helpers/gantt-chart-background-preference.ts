const STORAGE_KEY = "plane_gantt_chart_background_preferences";

export type GanttBackgroundPresetId = "forest" | "peaks" | "ocean" | "aurora";

export type GanttChartBackgroundValue =
  | { type: "none" }
  | { type: "preset"; preset: GanttBackgroundPresetId }
  | { type: "custom"; url: string };

export const GANTT_BACKGROUND_PRESETS: Record<GanttBackgroundPresetId, { url: string; labelKey: string }> = {
  forest: {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",

    labelKey: "boards.timeline_bg_forest",
  },

  peaks: {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",

    labelKey: "boards.timeline_bg_peaks",
  },

  ocean: {
    url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1920&q=80",

    labelKey: "boards.timeline_bg_ocean",
  },

  aurora: {
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",

    labelKey: "boards.timeline_bg_aurora",
  },
};

type GanttBackgroundPreferences = Record<string, GanttChartBackgroundValue>;

const buildScopeKey = (workspaceSlug: string, scope: string) => `${workspaceSlug}::${scope}`;

const readPreferences = (): GanttBackgroundPreferences => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw) as GanttBackgroundPreferences;

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writePreferences = (preferences: GanttBackgroundPreferences) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* ignore */
  }
};

export const getSavedGanttChartBackground = (
  workspaceSlug: string,

  scope: string
): GanttChartBackgroundValue => {
  const saved = readPreferences()[buildScopeKey(workspaceSlug, scope)];

  if (!saved) return { type: "none" };

  if (saved.type === "preset" && saved.preset in GANTT_BACKGROUND_PRESETS) return saved;

  if (saved.type === "custom" && typeof saved.url === "string" && saved.url.trim()) return saved;

  return { type: "none" };
};

export const saveGanttChartBackground = (
  workspaceSlug: string,

  scope: string,

  value: GanttChartBackgroundValue
) => {
  const preferences = readPreferences();

  const key = buildScopeKey(workspaceSlug, scope);

  if (value.type === "none") {
    delete preferences[key];
  } else {
    preferences[key] = value;
  }

  writePreferences(preferences);
};

export function resolveGanttBackgroundImageUrl(value: GanttChartBackgroundValue): string | null {
  if (value.type === "none") return null;

  if (value.type === "preset") return GANTT_BACKGROUND_PRESETS[value.preset]?.url ?? null;

  const url = value.url.trim();

  return url.length > 0 ? url : null;
}
