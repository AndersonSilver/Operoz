/** Ativa virtual scroll quando a lista excede este limiar (ADR: FE virtual vs paginação BE). */
export const CLIENT_360_VIRTUAL_SCROLL_THRESHOLD = 50;

export const CLIENT_360_VIRTUAL_SCROLL_MAX_HEIGHT = "min(70vh, 720px)";

export const CLIENT_360_VIRTUAL_ROW_HEIGHT = {
  list: 128,
  grid: 248,
  table: 56,
} as const;

export const CLIENT_360_VIRTUAL_OVERSCAN = {
  list: 8,
  grid: 4,
  table: 12,
} as const;

export function shouldClient360Virtualize(clientCount: number): boolean {
  return clientCount >= CLIENT_360_VIRTUAL_SCROLL_THRESHOLD;
}

export function client360GridColumnCount(viewportWidth: number): number {
  if (viewportWidth >= 1536) return 4;
  if (viewportWidth >= 1280) return 3;
  if (viewportWidth >= 640) return 2;
  return 1;
}

export function client360GridRowCount(clientCount: number, columns: number): number {
  if (columns <= 0) return clientCount;
  return Math.ceil(clientCount / columns);
}

export function client360GridRowClients<T>(clients: T[], rowIndex: number, columns: number): T[] {
  const start = rowIndex * columns;
  return clients.slice(start, start + columns);
}
