import { createRequire } from "node:module";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Operis: boards ligados por defeito (Dockerfile.web e .env.example); desligar com VITE_ENABLE_BOARDS=false
if (process.env.VITE_ENABLE_BOARDS === undefined) {
  process.env.VITE_ENABLE_BOARDS = "true";
}

// Monorepo root — required so Vite can resolve workspace packages (e.g. @operis/propel/dist) outside apps/web
const workspaceRoot = path.resolve(__dirname, "../..");

const editorPkg = path.resolve(__dirname, "../../packages/editor/package.json");
const requireEditor = createRequire(editorPkg);

/** `require.resolve` devolve `dist/index.cjs`; o browser precisa do ESM `dist/index.js` para named exports (ex. Decoration). */
function prosemirrorEsmEntry(moduleName: string): string {
  return path.join(path.dirname(requireEditor.resolve(moduleName)), "index.js");
}

/** Uma única cópia física de ProseMirror (codemark vs @tiptap/pm) evita RangeError de plugin keyed. */
const prosemirrorAliases = {
  "prosemirror-state": prosemirrorEsmEntry("prosemirror-state"),
  "prosemirror-view": prosemirrorEsmEntry("prosemirror-view"),
  "prosemirror-model": prosemirrorEsmEntry("prosemirror-model"),
  "prosemirror-transform": prosemirrorEsmEntry("prosemirror-transform"),
} as const;

// Expose only vars starting with VITE_
const viteEnv = Object.keys(process.env)
  .filter((k) => k.startsWith("VITE_"))
  .reduce<Record<string, string>>((a, k) => {
    a[k] = process.env[k] ?? "";
    return a;
  }, {});

viteEnv.VITE_ENABLE_BOARDS = process.env.VITE_ENABLE_BOARDS ?? "true";

const enableBoards = process.env.VITE_ENABLE_BOARDS ?? "true";

export default defineConfig(() => ({
  define: {
    "process.env": JSON.stringify({ ...viteEnv, VITE_ENABLE_BOARDS: enableBoards }),
    "import.meta.env.VITE_ENABLE_BOARDS": JSON.stringify(enableBoards),
  },
  build: {
    assetsInlineLimit: 0,
  },
  plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      // Use workspace source so SSR/dev never serves a stale packages/utils/dist (e.g. old isomorphic-dompurify).
      "@operis/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      ...prosemirrorAliases,
      // Next.js compatibility shims used within web
      "next/link": path.resolve(__dirname, "app/compat/next/link.tsx"),
      "next/navigation": path.resolve(__dirname, "app/compat/next/navigation.ts"),
      "next/script": path.resolve(__dirname, "app/compat/next/script.tsx"),
    },
    dedupe: ["react", "react-dom", "@headlessui/react"],
  },
  server: {
    host: "127.0.0.1",
    fs: {
      allow: [workspaceRoot],
    },
  },
  // No SSR-specific overrides needed; alias resolves to ESM build
}));
