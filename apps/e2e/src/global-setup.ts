import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { request } from "@playwright/test";
import { checkStackHealth, seedOperozF0Data } from "./helpers/api";
import { cacheFilePath } from "./helpers/test-data";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:8000";
const webUrl = process.env.E2E_WEB_URL ?? "http://localhost:3000";

export default async function globalSetup() {
  console.log("→ F0 E2E: verificar stack…");
  await checkStackHealth(apiUrl, webUrl);

  const apiContext = await request.newContext({ baseURL: apiUrl });
  console.log("→ F0 E2E: seed API (user, workspace, board, projeto, issue)…");
  const testData = await seedOperozF0Data(apiContext, apiUrl);

  mkdirSync(dirname(cacheFilePath()), { recursive: true });
  writeFileSync(cacheFilePath(), JSON.stringify(testData, null, 2));

  mkdirSync(join(rootDir, "playwright/.auth"), { recursive: true });
  console.log("→ F0 E2E: guardar sessão API (cookies) para o browser…");
  await apiContext.storageState({ path: join(rootDir, "playwright/.auth/user.json") });
  await apiContext.dispose();

  console.log(`✓ F0 E2E setup: workspace=${testData.workspaceSlug} board=${testData.boardSlug}`);
}
