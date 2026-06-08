import { test, expect } from "@playwright/test";
import { waitForApp } from "./helpers/page";
import { loginViaUi } from "./helpers/auth-ui";
import { loadTestData } from "./helpers/test-data";

const data = loadTestData();

test.describe("F0 auth UI", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("A1: login via formulário (email + senha)", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // Sem instance configurada a home não mostra o formulário.
    const emailField = page.locator("#email");
    if ((await emailField.count()) === 0) {
      test.skip(true, "Instance sem auth na web — correr scripts/ensure-e2e-instance.sh");
    }

    await loginViaUi(page, data.email, data.password);
    await expect(page).toHaveURL(new RegExp(`/${data.workspaceSlug}`), { timeout: 45_000 });
    await expect(page.getByText(data.boardName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });
});
