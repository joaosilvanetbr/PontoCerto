import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { createDb } from "@db/connection";
import { users, timeEntries } from "@db/schema";

export const appRouter = createRouter({
  // Health check
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // ===== USERS =====
  user: createRouter({
    get: publicQuery.query(async ({ ctx }) => {
      const db = createDb(ctx.env.DB);
      const result = await db.select().from(users).limit(1);
      return result[0] ?? null;
    }),

    create: publicQuery
      .input(z.object({
        name: z.string(),
        company: z.string(),
        role: z.string(),
        avatar: z.string().optional(),
        pin: z.string().length(4),
        workStartTime: z.string().default("08:00"),
        workEndTime: z.string().default("17:00"),
        lunchDuration: z.number().default(60),
        dailyTarget: z.number().default(528),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const result = await db.insert(users).values(input).returning();
        return result[0];
      }),

    update: publicQuery
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        company: z.string().optional(),
        role: z.string().optional(),
        avatar: z.string().optional(),
        pin: z.string().length(4).optional(),
        workStartTime: z.string().optional(),
        workEndTime: z.string().optional(),
        lunchDuration: z.number().optional(),
        dailyTarget: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const { id, ...data } = input;
        const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
        return result[0];
      }),
  }),

  // ===== TIME ENTRIES =====
  entry: createRouter({
    list: publicQuery
      .input(z.object({
        userId: z.number(),
        date: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const userId = input?.userId ?? 1;

        let query = db.select().from(timeEntries).where(eq(timeEntries.userId, userId)).orderBy(desc(timeEntries.timestamp));

        if (input?.date) {
          query = db.select().from(timeEntries)
            .where(and(eq(timeEntries.userId, userId), eq(timeEntries.date, input.date)))
            .orderBy(timeEntries.timestamp) as typeof query;
        }

        return query;
      }),

    getByDate: publicQuery
      .input(z.object({
        userId: z.number(),
        date: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        return db.select().from(timeEntries)
          .where(and(eq(timeEntries.userId, input.userId), eq(timeEntries.date, input.date)))
          .orderBy(timeEntries.timestamp);
      }),

    create: publicQuery
      .input(z.object({
        userId: z.number(),
        type: z.enum(["in", "lunch-out", "lunch-in", "out"]),
        timestamp: z.number(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const result = await db.insert(timeEntries).values(input).returning();
        return result[0];
      }),

    update: publicQuery
      .input(z.object({
        id: z.number(),
        timestamp: z.number(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const { id, ...data } = input;
        const result = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
        return result[0];
      }),

    delete: publicQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        await db.delete(timeEntries).where(eq(timeEntries.id, input.id));
        return { success: true };
      }),

    listByMonth: publicQuery
      .input(z.object({
        userId: z.number(),
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const prefix = `${input.year}-${String(input.month).padStart(2, "0")}`;
        // D1 doesn't support LIKE in the same way, so we filter in memory
        const all = await db.select().from(timeEntries)
          .where(eq(timeEntries.userId, input.userId))
          .orderBy(desc(timeEntries.timestamp));
        return all.filter(e => e.date.startsWith(prefix));
      }),
  }),
});

export type AppRouter = typeof appRouter;
