/**
 * tRPC Router - PontoCerto
 *
 * All endpoints with security:
 * - auth.login: rate-limited, bcrypt PIN verification
 * - entry.*: JWT-authenticated
 * - user.*: public read, JWT for sensitive ops
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { createDb } from "@db/connection";
import { users, timeEntries } from "@db/schema";
import { createToken } from "./lib/jwt";
import { verifyPin, hashPin } from "./lib/hash";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "./lib/rate-limit";

export const appRouter = createRouter({
  // ===== HEALTH =====
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // ===== AUTH =====
  auth: createRouter({
    login: publicQuery
      .input(z.object({
        pin: z.string().length(4).regex(/^\d{4}$/, "PIN deve conter apenas numeros"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Rate limiting check
        const rateLimit = checkRateLimit(ctx.req);
        if (!rateLimit.allowed) {
          throw new Error(
            rateLimit.blocked
              ? `Muitas tentativas. Tente novamente em ${Math.ceil(rateLimit.resetIn / 60)} minutos.`
              : "Muitas tentativas. Aguarde um momento."
          );
        }

        const db = createDb(ctx.env.DB);
        const user = await db.select().from(users).limit(1);
        if (!user[0]) {
          recordFailedAttempt(ctx.req);
          throw new Error("Usuario nao encontrado");
        }

        // Verify PIN with bcrypt
        const valid = await verifyPin(input.pin, user[0].pin);
        if (!valid) {
          recordFailedAttempt(ctx.req);
          throw new Error("PIN incorreto");
        }

        // Success - clear attempts and generate token
        clearAttempts(ctx.req);
        const token = await createToken({ userId: user[0].id, pin: user[0].pin }, ctx.env);
        return { token, user: user[0] };
      }),

    me: authedQuery.query(async ({ ctx }) => {
      const db = createDb(ctx.env.DB);
      const user = await db.select().from(users).where(eq(users.id, ctx.user!.userId)).limit(1);
      if (!user[0]) throw new Error("Usuario nao encontrado");
      return user[0];
    }),

    changePin: authedQuery
      .input(z.object({
        currentPin: z.string().length(4).regex(/^\d{4}$/),
        newPin: z.string().length(4).regex(/^\d{4}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const user = await db.select().from(users).where(eq(users.id, ctx.user!.userId)).limit(1);
        if (!user[0]) throw new Error("Usuario nao encontrado");

        const valid = await verifyPin(input.currentPin, user[0].pin);
        if (!valid) throw new Error("PIN atual incorreto");

        const hashedNewPin = await hashPin(input.newPin);
        await db.update(users)
          .set({ pin: hashedNewPin })
          .where(eq(users.id, ctx.user!.userId));

        // Generate new token with updated pin
        const token = await createToken({ userId: user[0].id, pin: input.newPin }, ctx.env);
        return { token, success: true };
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
        name: z.string().min(1).max(100),
        company: z.string().min(1).max(100),
        role: z.string().min(1).max(100),
        avatar: z.string().optional(),
        pin: z.string().length(4).regex(/^\d{4}$/),
        workStartTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
        workEndTime: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
        lunchDuration: z.number().min(15).max(180).default(60),
        dailyTarget: z.number().min(60).max(1440).default(528),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const hashedPin = await hashPin(input.pin);
        const result = await db.insert(users).values({
          ...input,
          pin: hashedPin,
        }).returning();
        return result[0];
      }),

    update: authedQuery
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        company: z.string().min(1).max(100).optional(),
        role: z.string().min(1).max(100).optional(),
        avatar: z.string().optional(),
        workStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        workEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        lunchDuration: z.number().min(15).max(180).optional(),
        dailyTarget: z.number().min(60).max(1440).optional(),
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
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        return db.select().from(timeEntries)
          .where(and(eq(timeEntries.userId, ctx.user!.userId), eq(timeEntries.date, input.date)))
          .orderBy(timeEntries.timestamp);
      }),

    create: authedQuery
      .input(z.object({
        type: z.enum(["in", "lunch-out", "lunch-in", "out"]),
        timestamp: z.number().min(0),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
        id: z.number().positive(),
        timestamp: z.number().min(0),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const { id, ...data } = input;
        const result = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
        return result[0];
      }),

    delete: authedQuery
      .input(z.object({ id: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        await db.delete(timeEntries).where(eq(timeEntries.id, input.id));
        return { success: true };
      }),

    listByMonth: authedQuery
      .input(z.object({
        year: z.number().min(2020).max(2100),
        month: z.number().min(1).max(12),
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
