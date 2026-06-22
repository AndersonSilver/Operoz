import { defineConfig, devices } from "@playwright/test";

const webUrl = process.env.E2E_WEB_URL ?? "http://localhost:3000";

/** Config dedicada para gravar o screencast do vídeo promocional. */
export default defineConfig({
  testDir: "./src",
  testMatch: "demo-video.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [["list"]],
  globalSetup: "./src/global-setup.ts",
  outputDir: "test-results/demo-video",
  use: {
    baseURL: webUrl,
    storageState: "playwright/.auth/user.json",
    video: "on",
    viewport: { width: 1920, height: 1080 },
    trace: "off",
    screenshot: "off",
    ...devices["Desktop Chrome"],
  },
});
