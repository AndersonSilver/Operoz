import { createRequire } from "node:module";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { joinUrlPath } from "@plane/utils";

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

export default defineConfig(() => ({
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
