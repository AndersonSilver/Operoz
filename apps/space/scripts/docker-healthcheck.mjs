/**
 * Container health probe for the Space SSR server.
 * Uses Node fetch (no curl/shell) and only checks loopback to avoid SSRF-style misuse.
 */
const url = process.env.OPERIS_HEALTHCHECK_URL ?? "http://127.0.0.1:3000/spaces/";
const timeoutMs = Number(process.env.OPERIS_HEALTHCHECK_TIMEOUT_MS ?? 4000);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    redirect: "manual",
    headers: { Accept: "text/html,application/json" },
  });
  const ok = response.status >= 200 && response.status < 400;
  process.exit(ok ? 0 : 1);
} catch {
  process.exit(1);
} finally {
  clearTimeout(timer);
}
