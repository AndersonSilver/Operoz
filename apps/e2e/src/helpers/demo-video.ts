import type { Locator, Page } from "@playwright/test";

const SETTLE_MS = 900;
export const DEMO_SCENE_PAUSE_MS = 4_000;

/** Oculta spinners fullscreen durante gravação promocional (não altera produção). */
export async function installPromoRecordingMode(page: Page) {
  await page.addInitScript(() => {
    document.documentElement.dataset.promoRecording = "1";
    const css = `
      html[data-promo-recording] div.flex.h-screen.w-full.items-center.justify-center:has([role="status"]),
      html[data-promo-recording] div.flex.h-full.items-center.justify-center:has([role="status"]),
      html[data-promo-recording] div.flex.h-full.min-h-\\[200px\\].items-center.justify-center:has([role="status"]) {
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    const attach = () => {
      if (document.getElementById("promo-recording-style")) return;
      const style = document.createElement("style");
      style.id = "promo-recording-style";
      style.textContent = css;
      document.head.appendChild(style);
    };
    if (document.head) attach();
    else document.addEventListener("DOMContentLoaded", attach, { once: true });
  });
}

const fullscreenSpinnerLocator = (page: Page) =>
  page.locator(
    [
      "div.flex.h-screen.w-full.items-center.justify-center [role='status']",
      "div.flex.h-full.items-center.justify-center [role='status']",
      "div.flex.h-full.min-h-\\[200px\\].items-center.justify-center [role='status']",
    ].join(", ")
  );

async function waitForNoFullscreenSpinner(page: Page) {
  const spinner = fullscreenSpinnerLocator(page);
  const count = await spinner.count();
  if (count === 0) return;
  await spinner
    .first()
    .waitFor({ state: "hidden", timeout: 60_000 })
    .catch(() => {});
}

/** Aguarda sumir loaders e o conteúdo principal ficar visível antes de gravar a cena. */
export async function waitForDemoScene(page: Page, anchor: Locator) {
  await page.waitForLoadState("domcontentloaded");
  await waitForNoFullscreenSpinner(page);
  await anchor.waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(SETTLE_MS);
  await waitForNoFullscreenSpinner(page);
}

export async function pauseOnScene(page: Page, anchor: Locator, ms = DEMO_SCENE_PAUSE_MS) {
  await waitForDemoScene(page, anchor);
  await page.waitForTimeout(ms);
}

export async function clickBoardTab(page: Page, label: string) {
  const tab = page.getByRole("button", { name: label, exact: true });
  await tab.click();
}

export async function gotoDemoScene(page: Page, url: string, anchor: Locator) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForDemoScene(page, anchor);
}
