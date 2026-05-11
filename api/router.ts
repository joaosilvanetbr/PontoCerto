import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { createDb } from "@db/connection";
import { users, timeEntries } from "@db/schema";
import { createToken } from "./lib/jwt";

export const appRouter = createRouter({
  // Health check
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // ===== AUTH =====
  auth: createRouter({
    login: publicQuery
      .input(z.object({
        pin: z.string().length(4),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const user = await db.select().from(users).limit(1);
        if (!user[0]) {
          throw new Error("Usuario nao encontrado");
        }
        if (user[0].pin !== input.pin) {
          throw new Error("PIN incorreto");
        }
        const token = await createToken({ userId: user[0].id, pin: user[0].pin }, ctx.env);
        return { token, user: user[0] };
      }),

    me: authedQuery.query(async ({ ctx }) => {
      const db = createDb(ctx.env.DB);
      const user = await db.select().from(users).where(eq(users.id, ctx.user!.userId)).limit(1);
      if (!user[0]) throw new Error("Usuario nao encontrado");
      return user[0];
    }),
  }),

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
    list: authedQuery
      .input(z.object({
        date: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const userId = ctx.user!.userId;
        if (input?.date) {
          return db.select().from(timeEntries)
            .where(and(eq(timeEntries.userId, userId), eq(timeEntries.date, input.date)))
            .orderBy(timeEntries.timestamp);
        }
        return db.select().from(timeEntries)
          .where(eq(timeEntries.userId, userId))
          .orderBy(desc(timeEntries.timestamp));
      }),

    getByDate: authedQuery
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        return db.select().from(timeEntries)
          .where(and(eq(timeEntries.userId, ctx.user!.userId), eq(timeEntries.date, input.date)))
          .orderBy(timeEntries.timestamp);
      }),

    create: authedQuery
      .input(z.object({
        type: z.enum(["in", "lunch-out", "lunch-in", "out"]),
        timestamp: z.number(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const result = await db.insert(timeEntries).values({
          userId: ctx.user!.userId,
          ...input,
        }).returning();
        return result[0];
      }),

    update: authedQuery
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

    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        await db.delete(timeEntries).where(eq(timeEntries.id, input.id));
        return { success: true };
      }),

    listByMonth: authedQuery
      .input(z.object({
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const prefix = `${input.year}-${String(input.month).padStart(2, "0")}`;
        const all = await db.select().from(timeEntries)
          .where(eq(timeEntries.userId, ctx.user!.userId))
          .orderBy(desc(timeEntries.timestamp));
        return all.filter(e => e.date.startsWith(prefix));
      }),
  }),
});

export type AppRouter = typeof appRouter;
