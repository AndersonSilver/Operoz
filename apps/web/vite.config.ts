import { createRequire } from "node:module";
import path from "node:path";
import * as dotenv from "dotenv";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Operoz: boards ligados por defeito (Dockerfile.web e .env.example); desligar com VITE_ENABLE_BOARDS=false
if (process.env.VITE_ENABLE_BOARDS === undefined) {
  process.env.VITE_ENABLE_BOARDS = "true";
}

// Monorepo root — required so Vite can resolve workspace packages (e.g. @operoz/propel/dist) outside apps/web
const workspaceRoot = path.resolve(__dirname, "../..");
const propelSrcRoot = path.resolve(workspaceRoot, "packages/propel/src");
const sharedStateSrcEntry = path.resolve(workspaceRoot, "packages/shared-state/src/index.ts");
const servicesSrcEntry = path.resolve(workspaceRoot, "packages/services/src/index.ts");
const typesSrcEntry = path.resolve(workspaceRoot, "packages/types/src/index.ts");
const constantsSrcEntry = path.resolve(workspaceRoot, "packages/constants/src/index.ts");

const editorIsEmojiSupportedEntry = path.resolve(workspaceRoot, "packages/editor/src/core/utils/is-emoji-supported.ts");

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

export default defineConfig(({ command }) => {
  const isDevServer = command === "serve";

  const alias: Array<{ find: string | RegExp; replacement: string }> = [
    {
      find: "@operoz/utils",
      replacement: path.resolve(__dirname, "../../packages/utils/src/index.ts"),
    },
    {
      find: "@operoz/i18n",
      replacement: path.resolve(__dirname, "../../packages/i18n/src/index.ts"),
    },
    {
      find: "@operoz/services",
      replacement: servicesSrcEntry,
    },
    {
      find: "is-emoji-supported",
      replacement: editorIsEmojiSupportedEntry,
    },
    ...Object.entries(prosemirrorAliases).map(([find, replacement]) => ({ find, replacement })),
    { find: "next/link", replacement: path.resolve(__dirname, "app/compat/next/link.tsx") },
    { find: "next/navigation", replacement: path.resolve(__dirname, "app/compat/next/navigation.ts") },
    { find: "next/script", replacement: path.resolve(__dirname, "app/compat/next/script.tsx") },
  ];

  if (isDevServer) {
    // Dev: source TS (como utils/i18n/propel) — não exige packages/*/dist pré-buildado.
    alias.unshift(
      {
        find: "@operoz/types",
        replacement: typesSrcEntry,
      },
      {
        find: "@operoz/constants",
        replacement: constantsSrcEntry,
      },
      {
        find: "@operoz/shared-state",
        replacement: sharedStateSrcEntry,
      },
      {
        find: /^@operoz\/propel\/styles\/(.+\.css)$/,
        replacement: `${propelSrcRoot}/styles/$1`,
      },
      {
        find: /^@operoz\/propel\/(.+)$/,
        replacement: `${propelSrcRoot}/$1/index.ts`,
      }
    );
  }

  return {
    define: {
      "process.env": JSON.stringify({ ...viteEnv, VITE_ENABLE_BOARDS: enableBoards }),
      "import.meta.env.VITE_ENABLE_BOARDS": JSON.stringify(enableBoards),
    },
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [reactRouter(), tsconfigPaths({ projects: [path.resolve(__dirname, "tsconfig.json")] })],
    resolve: {
      alias,
      dedupe: ["react", "react-dom", "@headlessui/react"],
    },
    server: {
      host: "127.0.0.1",
      fs: {
        allow: [workspaceRoot],
      },
    },
    // No SSR-specific overrides needed; alias resolves to ESM build
  };
});
