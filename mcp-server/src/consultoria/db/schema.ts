export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS c_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  repository_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS c_modules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES c_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS c_cards (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES c_modules(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  start_date TEXT,
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS c_tasks (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES c_cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TEXT,
  calendar_event_id TEXT,
  calendar_reminder_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS c_prds (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL UNIQUE REFERENCES c_modules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
