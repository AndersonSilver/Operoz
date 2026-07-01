import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@operoz/utils";

const envDir = path.resolve(__dirname);
// Monorepo root (…/plane) — required so Vite can read workspace packages (e.g. @operoz/propel/dist) outside apps/admin
const workspaceRoot = path.resolve(__dirname, "../..");

/**
 * Build the `process.env` object injected into the client bundle.
 * Uses Vite's loadEnv so `.env` is always read from this app directory (works when Turbo/npm runs from monorepo root).
 */
function buildViteClientEnv(mode: string): Record<string, string> {
  const loaded = loadEnv(mode, envDir, "");
  const viteEnv = Object.keys(loaded)
    .filter((k) => k.startsWith("VITE_"))
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = loaded[k] ?? "";
      return acc;
    }, {});

  // Without this in dev, axios uses an empty base URL and calls /api/* on the admin origin (3001) → 404.
  if (mode === "development" && !viteEnv.VITE_API_BASE_URL?.trim()) {
    viteEnv.VITE_API_BASE_URL = "http://localhost:8000";
  }

  return viteEnv;
}

export default defineConfig(({ mode }) => {
  const viteEnv = buildViteClientEnv(mode);
  const basePath = joinUrlPath(viteEnv.VITE_ADMIN_BASE_PATH ?? "", "/") ?? "/";

  return {
    base: basePath,
    define: {
      "process.env": JSON.stringify(viteEnv),
    },
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
    resolve: {
      alias: {
        // Use workspace source so SSR/dev never serves a stale packages/utils/dist.
        "@operoz/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
        // Dev: source TS (como apps/web) — evita falha ao resolver packages/i18n/dist no Vite.
        "@operoz/i18n": path.resolve(__dirname, "../../packages/i18n/src/index.ts"),
        // Next.js compatibility shims used within admin
        "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
        "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      // Listen on all interfaces so both localhost and 127.0.0.1 work on Windows.
      host: true,
      port: 3001,
      fs: {
        allow: [workspaceRoot],
      },
    },
  };
});
