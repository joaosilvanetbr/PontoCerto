import { relations } from "drizzle-orm";
import { users, timeEntries } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));
