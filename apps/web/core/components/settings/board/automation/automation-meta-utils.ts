import { renderFormattedDate, renderFormattedTime } from "@operoz/utils";

export function formatAutomationCardTimestamp(iso: string | undefined | null): string | undefined {
  if (!iso) return undefined;
  const date = renderFormattedDate(iso, "dd MMM yyyy");
  const time = renderFormattedTime(iso);
  if (!date) return undefined;
  return time ? `${date}, ${time}` : date;
}

export function shouldShowAutomationUpdatedMeta(
  createdAt?: string,
  updatedAt?: string,
  createdBy?: string | null,
  updatedBy?: string | null
): boolean {
  if (!updatedAt) return false;
  if (createdAt && updatedAt !== createdAt) return true;
  if (createdBy && updatedBy && createdBy !== updatedBy) return true;
  return false;
}
