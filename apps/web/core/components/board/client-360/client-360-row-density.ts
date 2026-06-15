export type Client360RowDensity = "comfortable" | "compact";

const STORAGE_KEY_PREFIX = "client360_row_density";

export const CLIENT_360_VIRTUAL_ROW_HEIGHT_BY_DENSITY = {
  comfortable: { list: 128, grid: 248, table: 56 },
  compact: { list: 100, grid: 248, table: 42 },
} as const;

export function loadClient360RowDensity(scope: string): Client360RowDensity {
  if (typeof window === "undefined") return "comfortable";
  try {
    const value = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${scope}`);
    return value === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function saveClient360RowDensity(scope: string, density: Client360RowDensity) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_${scope}`, density);
  } catch {
    /* ignore */
  }
}

export function toggleClient360RowDensity(density: Client360RowDensity): Client360RowDensity {
  return density === "comfortable" ? "compact" : "comfortable";
}

export function client360VirtualRowHeight(
  density: Client360RowDensity,
  mode: keyof (typeof CLIENT_360_VIRTUAL_ROW_HEIGHT_BY_DENSITY)["comfortable"]
): number {
  return CLIENT_360_VIRTUAL_ROW_HEIGHT_BY_DENSITY[density][mode];
}

export function client360TableRowPadding(density: Client360RowDensity): string {
  return density === "compact" ? "py-1.5" : "py-2.5";
}

export function client360DensityCellClass(className: string, density: Client360RowDensity): string {
  if (density === "comfortable") return className;
  return className.replace(/\bpy-2\.5\b/g, "py-1.5");
}

export function client360ListRowPadding(density: Client360RowDensity): string {
  return density === "compact" ? "py-3" : "py-4";
}

export function client360ListRowLogoSize(density: Client360RowDensity): number {
  return density === "compact" ? 20 : 22;
}

export function client360TableLogoSize(density: Client360RowDensity): number {
  return density === "compact" ? 16 : 18;
}

export function client360TableLogoBoxClass(density: Client360RowDensity): string {
  return density === "compact" ? "size-7" : "size-8";
}
