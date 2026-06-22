import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import {
  clickBoardTab,
  DEMO_SCENE_PAUSE_MS,
  gotoDemoScene,
  installPromoRecordingMode,
  pauseOnScene,
} from "./helpers/demo-video";
import { loadTestData } from "./helpers/test-data";

const e2eRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const authFile = join(e2eRoot, "playwright/.auth/user.json");

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  const data = loadTestData();
  const { workspaceSlug: ws, boardSlug: board, projectId } = data;

  const context = await browser.newContext({
    storageState: authFile,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  await installPromoRecordingMode(page);

  const routes = [
    `/${ws}/boards/${board}`,
    `/${ws}/boards/${board}/views`,
    `/${ws}/projects/${projectId}/issues`,
    `/${ws}/projects/${projectId}/issues?layout=board`,
    `/${ws}/boards/${board}/clientes`,
    `/${ws}/boards/${board}/clientes/${projectId}`,
    `/${ws}/visao-360`,
  ];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" }).catch(() => page.goto(route));
    await page.waitForTimeout(1_200);
  }

  await context.close();
});

test("promo — gravação híbrida Operoz", async ({ page }) => {
  const data = loadTestData();
  const { workspaceSlug: ws, boardSlug: board, projectId } = data;

  await installPromoRecordingMode(page);

  const boardHeading = page.getByRole("heading", { name: data.boardName, exact: false });
  const issueAnchor = page.getByText(data.issueName, { exact: false }).first();
  const client360Title = page.getByRole("heading", { name: "Visão 360", exact: true });
  const projectAnchor = page.getByText(data.projectName, { exact: false }).first();

  await gotoDemoScene(page, `/${ws}/boards/${board}`, boardHeading);
  await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);

  await clickBoardTab(page, "Quadro");
  await pauseOnScene(page, issueAnchor);

  await clickBoardTab(page, "Resumo");
  await pauseOnScene(page, boardHeading);

  const projectLink = page.locator("a").filter({ hasText: data.projectName }).first();
  if (await projectLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await projectLink.click();
    await pauseOnScene(page, issueAnchor);
  } else {
    await gotoDemoScene(page, `/${ws}/projects/${projectId}/issues`, issueAnchor);
    await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);
  }

  if (await issueAnchor.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await issueAnchor.click();
    await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }

  await gotoDemoScene(page, `/${ws}/projects/${projectId}/issues?layout=board`, issueAnchor);
  await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);

  await gotoDemoScene(page, `/${ws}/boards/${board}/clientes`, client360Title);
  await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);

  await gotoDemoScene(page, `/${ws}/boards/${board}/clientes/${projectId}`, projectAnchor);
  await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);

  await gotoDemoScene(page, `/${ws}/visao-360`, client360Title);
  await page.waitForTimeout(DEMO_SCENE_PAUSE_MS);
});
