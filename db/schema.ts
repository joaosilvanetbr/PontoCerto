import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Tabela de usuários (perfil)
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  workStartTime: text("work_start_time").notNull().default("08:00"),
  workEndTime: text("work_end_time").notNull().default("17:00"),
  lunchDuration: integer("lunch_duration", { mode: "number" }).notNull().default(60),
  dailyTarget: integer("daily_target", { mode: "number" }).notNull().default(528), // 8.8h in minutes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Tabela de registros de ponto (time entries)
export const timeEntries = sqliteTable("time_entries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id", { mode: "number" }).notNull(),
  type: text("type", { enum: ["in", "lunch-out", "lunch-in", "out"] }).notNull(),
  timestamp: integer("timestamp", { mode: "number" }).notNull(), // unix timestamp in ms
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
