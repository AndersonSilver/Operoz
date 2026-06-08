import type { Page } from "@playwright/test";

/** Aguarda a SPA hidratar após navegação (Vite dev pode demorar). */
export async function waitForApp(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.body?.innerText && !document.body.innerText.startsWith("Loading"), null, {
    timeout: 30_000,
  });
}
