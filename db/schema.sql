-- Cloudflare D1 Schema (SQLite)
-- PontoCerto - Controle de Ponto

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  work_start_time TEXT NOT NULL DEFAULT '08:00',
  work_end_time TEXT NOT NULL DEFAULT '17:00',
  lunch_duration INTEGER NOT NULL DEFAULT 60,
  daily_target INTEGER NOT NULL DEFAULT 528,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('in', 'lunch-out', 'lunch-in', 'out')),
  timestamp INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON time_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_date ON time_entries(date);
