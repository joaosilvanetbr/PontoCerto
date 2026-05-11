-- COPIE E COLE NO CONSOLE DO D1 (Cloudflare Dashboard)
-- PontoCerto - Schema + Dados Iniciais

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  pin TEXT NOT NULL DEFAULT '1234',
  work_start_time TEXT NOT NULL DEFAULT '08:00',
  work_end_time TEXT NOT NULL DEFAULT '17:00',
  lunch_duration INTEGER NOT NULL DEFAULT 60,
  daily_target INTEGER NOT NULL DEFAULT 528,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Tabela de registros de ponto
CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('in', 'lunch-out', 'lunch-in', 'out')),
  timestamp INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON time_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_date ON time_entries(date);

-- Usuário padrão
INSERT INTO users (name, company, role, avatar, pin, work_start_time, work_end_time, lunch_duration, daily_target)
VALUES (
  'Carlos Eduardo',
  'Tech Solutions Brasil',
  'Desenvolvedor Full Stack',
  '/assets/avatar-user.jpg',
  '1234',
  '08:00',
  '17:00',
  60,
  528
);

-- Registros de ponto: Semana 1 (05-09/05/2025)
INSERT INTO time_entries (user_id, type, timestamp, date) VALUES
  (1, 'in',        1746438000000, '2025-05-05'),
  (1, 'lunch-out', 1746459600000, '2025-05-05'),
  (1, 'lunch-in',  1746463200000, '2025-05-05'),
  (1, 'out',       1746475800000, '2025-05-05'),
  (1, 'in',        1746524400000, '2025-05-06'),
  (1, 'lunch-out', 1746546000000, '2025-05-06'),
  (1, 'lunch-in',  1746549600000, '2025-05-06'),
  (1, 'out',       1746562200000, '2025-05-06'),
  (1, 'in',        1746610800000, '2025-05-07'),
  (1, 'lunch-out', 1746632400000, '2025-05-07'),
  (1, 'lunch-in',  1746636000000, '2025-05-07'),
  (1, 'out',       1746648600000, '2025-05-07'),
  (1, 'in',        1746697200000, '2025-05-08'),
  (1, 'lunch-out', 1746718800000, '2025-05-08'),
  (1, 'lunch-in',  1746722400000, '2025-05-08'),
  (1, 'out',       1746735000000, '2025-05-08'),
  (1, 'in',        1746783600000, '2025-05-09'),
  (1, 'lunch-out', 1746805200000, '2025-05-09'),
  (1, 'lunch-in',  1746808800000, '2025-05-09'),
  (1, 'out',       1746821400000, '2025-05-09');

-- Registros de ponto: Semana 2 (12-16/05/2025)
INSERT INTO time_entries (user_id, type, timestamp, date) VALUES
  (1, 'in',        1747042800000, '2025-05-12'),
  (1, 'lunch-out', 1747064400000, '2025-05-12'),
  (1, 'lunch-in',  1747068000000, '2025-05-12'),
  (1, 'out',       1747080600000, '2025-05-12'),
  (1, 'in',        1747129200000, '2025-05-13'),
  (1, 'lunch-out', 1747143600000, '2025-05-13'),
  (1, 'lunch-in',  1747147200000, '2025-05-13'),
  (1, 'out',       1747159800000, '2025-05-13'),
  (1, 'in',        1747215600000, '2025-05-14'),
  (1, 'lunch-out', 1747237200000, '2025-05-14'),
  (1, 'lunch-in',  1747240800000, '2025-05-14'),
  (1, 'out',       1747253400000, '2025-05-14'),
  (1, 'in',        1747302000000, '2025-05-15'),
  (1, 'lunch-out', 1747323600000, '2025-05-15'),
  (1, 'lunch-in',  1747327200000, '2025-05-15'),
  (1, 'out',       1747339800000, '2025-05-15'),
  (1, 'in',        1747388400000, '2025-05-16'),
  (1, 'lunch-out', 1747410000000, '2025-05-16'),
  (1, 'lunch-in',  1747413600000, '2025-05-16'),
  (1, 'out',       1747426200000, '2025-05-16');
