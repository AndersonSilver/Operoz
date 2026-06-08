import { test, expect } from "@playwright/test";
import { waitForApp } from "./helpers/page";
import { loadTestData } from "./helpers/test-data";

const data = loadTestData();

test.describe("F0 criação via UI", () => {
  test("B2: criar board pelo settings", async ({ page }) => {
    const boardName = `UI Board ${Date.now()}`;
    await page.goto(`/${data.workspaceSlug}/settings/boards/`);
    await waitForApp(page);

    await page.getByRole("button", { name: /create board|criar board|add board/i }).click();
    await expect(page.getByRole("heading", { name: /create board|criar board/i })).toBeVisible();

    await page.getByPlaceholder(/squad as a service|nome do board/i).fill(boardName);
    await page.locator("form").getByRole("button", { name: /^create board$|^criar board$/i }).click();

    await expect(page.getByText(boardName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });

  test("C3: criar issue (card) no projeto", async ({ page }) => {
    const issueName = `UI Issue ${Date.now()}`;
    await page.goto(`/${data.workspaceSlug}/projects/${data.projectId}/issues`);
    await waitForApp(page);

    await page.getByRole("button", { name: /new work item|novo item|create card|criar card/i }).first().click();
    await expect(page.locator("#name")).toBeVisible({ timeout: 15_000 });

    await page.locator("#name").fill(issueName);
    await page.getByRole("button", { name: /^save$|^salvar$/i }).click();

    await expect(page.getByText(issueName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });
});
