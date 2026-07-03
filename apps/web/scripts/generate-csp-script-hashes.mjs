#!/usr/bin/env node
// Computes CSP sha256 hashes for every inline <script> in a built index.html.
// Used at Docker build time so nginx's script-src can drop 'unsafe-inline'
// while still allowing the inline bootstrap scripts Vite/React Router emit.
//
// Usage: node generate-csp-script-hashes.mjs <path-to-index.html>
// Prints a space-separated list like: 'sha256-AAA=' 'sha256-BBB='

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const [, , htmlPath] = process.argv;

if (!htmlPath) {
  console.error("Usage: generate-csp-script-hashes.mjs <path-to-index.html>");
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

const hashes = new Set();
let match = scriptRegex.exec(html);
while (match !== null) {
  const content = match[1];
  if (content.trim()) {
    const digest = createHash("sha256").update(content, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
  match = scriptRegex.exec(html);
}

if (hashes.size === 0) {
  console.error(`No inline <script> tags found in ${htmlPath}`);
  process.exit(1);
}

process.stdout.write([...hashes].join(" "));
