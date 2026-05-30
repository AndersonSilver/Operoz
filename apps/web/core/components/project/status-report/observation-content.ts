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
