/** Resolve public/ assets when admin is served under VITE_ADMIN_BASE_PATH (e.g. /god-mode). */
export function adminPublicUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = path.replace(/^\//, "");
  return `${base}${normalized}`;
}
