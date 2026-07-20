import { createRequire } from "node:module";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type Connect, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@operoz/utils";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

const basePath = joinUrlPath(process.env.VITE_SPACE_BASE_PATH ?? "", "/") ?? "/";

const editorPkg = path.resolve(__dirname, "../../packages/editor/package.json");
const requireEditor = createRequire(editorPkg);

function prosemirrorEsmEntry(moduleName: string): string {
  return path.join(path.dirname(requireEditor.resolve(moduleName)), "index.js");
}

const prosemirrorAliases = {
  "prosemirror-state": prosemirrorEsmEntry("prosemirror-state"),
  "prosemirror-view": prosemirrorEsmEntry("prosemirror-view"),
  "prosemirror-model": prosemirrorEsmEntry("prosemirror-model"),
  "prosemirror-transform": prosemirrorEsmEntry("prosemirror-transform"),
} as const;

/**
 * React Router's critical.css middleware (v8 Vite Env API) can miss requests under a
 * custom Vite `base`/`basename` (`/spaces`), so the SPA SSR handler returns HTML and
 * the browser rejects the stylesheet (MIME text/html). Intercept those URLs and emit
 * CSS — empty is enough to silence the MIME error; styles still load via globals.css.
 */
function criticalCssMimeGuard(): Plugin {
  return {
    name: "operoz-space-critical-css-mime-guard",
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (req, res, next) => {
        const pathname = (req.url ?? "").split("?")[0] ?? "";
        if (pathname.endsWith("/@react-router/critical.css")) {
          res.setHeader("Content-Type", "text/css; charset=utf-8");
          res.end("/* react-router critical css unavailable in base-path dev */\n");
          return;
        }
        next();
      };
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => ({
  base: basePath,
  define: {
    "process.env": JSON.stringify(viteEnv),
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [
    // Must run before @react-router/dev so we catch /spaces/@react-router/critical.css
    criticalCssMimeGuard(),
    reactRouter(),
    tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] }),
  ],
  resolve: {
    alias: {
      ...prosemirrorAliases,
      // Next.js compatibility shims used within space
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: "127.0.0.1",
  },
}));
