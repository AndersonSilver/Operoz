/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export function isObservationHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

export function observationLineToPlainText(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";
  if (!isObservationHtml(trimmed)) return trimmed;

  if (typeof document === "undefined") {
    return trimmed
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const div = document.createElement("div");
  div.innerHTML = trimmed;
  return div.textContent?.replace(/\s+/g, " ").trim() ?? trimmed;
}
