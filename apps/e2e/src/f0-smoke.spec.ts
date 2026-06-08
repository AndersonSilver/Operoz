import { test, expect } from "@playwright/test";
import { waitForApp } from "./helpers/page";
import { loadTestData } from "./helpers/test-data";

const data = loadTestData();

test.describe("F0 smoke UI — workspace → board → projeto → issue", () => {
  test("A1/A2: workspace carrega com sessão autenticada", async ({ page }) => {
    await page.goto(`/${data.workspaceSlug}/`);
    await waitForApp(page);
    await expect(page).toHaveURL(new RegExp(`/${data.workspaceSlug}`));
    await expect(page.getByText(data.workspaceName, { exact: false }).first()).toBeVisible();
  });

  test("B1: sidebar lista o board", async ({ page }) => {
    await page.goto(`/${data.workspaceSlug}/`);
    await waitForApp(page);
    await expect(page.getByText(data.boardName, { exact: false }).first()).toBeVisible();
  });

  test("B3–B9: tabs do hub board carregam", async ({ page }) => {
    const base = `/${data.workspaceSlug}/boards/${data.boardSlug}`;
    const routes: Array<{ path: string; text: RegExp }> = [
      { path: base, text: /overview|resumo/i },
      { path: `${base}/backlog`, text: /backlog/i },
      { path: `${base}/list`, text: /List|Lista/i },
      { path: `${base}/views`, text: /\bboard\b|quadro/i },
      { path: `${base}/timeline`, text: /timeline|cronograma/i },
      { path: `${base}/calendar`, text: /calendar|calendário/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await waitForApp(page);
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, "\\/")));
      await expect(page.locator("body")).not.toContainText("Page not found");
      await expect(page.locator("body")).toContainText(route.text);
    }
  });

  test("B10: settings board — acesso e funções", async ({ page }) => {
    const settingsBase = `/${data.workspaceSlug}/settings/boards/${data.boardSlug}`;
    await page.goto(`${settingsBase}/acesso`);
    await waitForApp(page);
    await expect(page).toHaveURL(/\/acesso/);
    await expect(page.locator("body")).not.toContainText("coming soon");

    await page.goto(`${settingsBase}/funcoes`);
    await waitForApp(page);
    await expect(page).toHaveURL(/\/funcoes/);
    await expect(page.locator("body")).not.toContainText("coming soon");
  });

  test("C1–C3: projeto abre e issue aparece na lista", async ({ page }) => {
    await page.goto(`/${data.workspaceSlug}/projects/${data.projectId}/issues`);
    await waitForApp(page);
    await expect(page).toHaveURL(new RegExp(data.projectId));
    await expect(page.getByText(data.issueName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });

  test("C5: layouts do projeto (lista e board)", async ({ page }) => {
    const base = `/${data.workspaceSlug}/projects/${data.projectId}/issues`;
    await page.goto(base);
    await waitForApp(page);
    await expect(page.getByText(data.issueName, { exact: false }).first()).toBeVisible();

    await page.goto(`${base}?layout=board`);
    await waitForApp(page);
    await expect(page).toHaveURL(/layout=board/);
    await expect(page.locator("body")).not.toContainText("Page not found");
  });
});
