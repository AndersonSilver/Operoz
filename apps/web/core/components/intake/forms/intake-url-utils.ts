export function formatShortPublicUrl(publicUrl: string, anchor: string): { display: string; full: string } {
  try {
    const parsed = new URL(publicUrl);
    const pathSuffix = `/forms/${anchor}`;
    return {
      display: `${parsed.host}${pathSuffix}`,
      full: publicUrl,
    };
  } catch {
    return {
      display: `…/forms/${anchor}`,
      full: publicUrl,
    };
  }
}
