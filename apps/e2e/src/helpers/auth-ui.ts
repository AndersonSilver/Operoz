import type { Page } from "@playwright/test";

/** Login via UI (form POST para a API + redirect). */
export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: /continuar|continue/i }).click();
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /continuar|workspace|espaço|go to|continue/i }).click();
  await page.waitForURL((url) => url.pathname !== "/" && !url.pathname.startsWith("/sign"), {
    timeout: 45_000,
  });
}
