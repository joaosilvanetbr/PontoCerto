-- Migration: Login por usuario e senha
-- Remove PIN, adiciona username e password
-- Limpa dados antigos (sem usuarios cadastrados)

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS time_entries;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  avatar TEXT,
  work_start_time TEXT NOT NULL DEFAULT '08:00',
  work_end_time TEXT NOT NULL DEFAULT '17:00',
  lunch_duration INTEGER NOT NULL DEFAULT 60,
  daily_target INTEGER NOT NULL DEFAULT 528,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
