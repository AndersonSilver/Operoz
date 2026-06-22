export function formatShortPublicUrl(
  publicUrl: string,
  anchor: string
): { path: string; display: string; host: string; full: string } {
  const path = `/forms/${anchor}`;
  try {
    const parsed = new URL(publicUrl);
    return {
      path,
      host: parsed.host,
      display: `${parsed.host}${path}`,
      full: publicUrl,
    };
  } catch {
    return {
      path,
      host: "",
      display: path,
      full: publicUrl,
    };
  }
}
