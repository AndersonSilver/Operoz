import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCHEMA_SQL } from "./schema.js";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = process.env.CONSULTORIA_DB_PATH ?? resolve(process.cwd(), "consultoria.db");
  mkdirSync(dirname(dbPath), { recursive: true });
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(SCHEMA_SQL);
  return _db;
}
