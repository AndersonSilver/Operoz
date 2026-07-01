/** Resolve public/ assets when Space is served under VITE_SPACE_BASE_PATH (e.g. /spaces). */
export function spacePublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}
