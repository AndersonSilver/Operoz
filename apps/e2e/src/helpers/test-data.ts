import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { E2ETestData } from "./api";

const cacheDir = join(dirname(fileURLToPath(import.meta.url)), "../../.cache");
const cacheFile = join(cacheDir, "test-data.json");

export function loadTestData(): E2ETestData {
  const raw = readFileSync(cacheFile, "utf-8");
  return JSON.parse(raw) as E2ETestData;
}

export function cacheFilePath() {
  return cacheFile;
}
