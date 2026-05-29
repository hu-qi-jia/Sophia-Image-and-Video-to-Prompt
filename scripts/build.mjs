import { resolve } from "node:path";
import { build as viteBuild } from "vite";
import { build as esbuild } from "esbuild";

const root = process.cwd();

// Preact alias: make "react" and "react-dom" resolve to Preact compat
const preactAlias = {
  "react": "preact/compat",
  "react-dom": "preact/compat",
  "react/jsx-runtime": "preact/jsx-runtime",
};

// ── Step 1: Vite builds HTML pages (options page stays React) ─────

await viteBuild({
  configFile: resolve(root, "vite.config.ts"),
});

// ── Step 2: esbuild builds background.js (ESM) ────────────────────

await esbuild({
  entryPoints: [resolve(root, "src/background/background.ts")],
  outfile: resolve(root, "dist/assets/background.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome114",
  jsx: "automatic",
  alias: preactAlias,
});

// ── Step 3: esbuild builds loader.js (tiny IIFE, vanilla JS) ──────

await esbuild({
  entryPoints: [resolve(root, "src/content/loader.ts")],
  outfile: resolve(root, "dist/assets/loader.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "chrome114",
  minify: true,
});

// ── Step 4: esbuild builds sophia-app.js (Preact, ESM) ────────────

await esbuild({
  entryPoints: [resolve(root, "src/content/app.tsx")],
  outfile: resolve(root, "dist/assets/sophia-app.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome114",
  minify: true,
  jsx: "automatic",
  alias: preactAlias,
  loader: {
    ".css": "text",
    ".png": "dataurl",
    ".svg": "dataurl",
  },
});
