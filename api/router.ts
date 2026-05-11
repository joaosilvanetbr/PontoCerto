/**
 * tRPC Router - PontoCerto
 *
 * All endpoints with security:
 * - auth.login: rate-limited, bcrypt password verification, Set-Cookie httpOnly JWT
 * - auth.register: public user creation
 * - entry.*: JWT-authenticated with ownership checks
 * - user.*: public read, JWT for sensitive ops
 */
import { z } from "zod";
import { eq, and, desc, like } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { createDb } from "@db/connection";
import { users, timeEntries } from "@db/schema";
import { createToken } from "./lib/jwt";
import { verifyPassword, hashPassword } from "./lib/hash";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "./lib/rate-limit";

const TOKEN_COOKIE_OPTIONS = "HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=604800";

function setTokenCookie(resHeaders: Headers, token: string): void {
  resHeaders.append("Set-Cookie", `pontocerto_token=${token}; ${TOKEN_COOKIE_OPTIONS}`);
}

export const appRouter = createRouter({
  // ===== HEALTH =====
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  // ===== AUTH =====
  auth: createRouter({
    login: publicQuery
      .input(z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);

        const rateLimit = await checkRateLimit(ctx.req, db);
        if (!rateLimit.allowed) {
          throw new Error(
            rateLimit.blocked
              ? `Muitas tentativas. Tente novamente em ${Math.ceil(rateLimit.resetIn / 60)} minutos.`
              : "Muitas tentativas. Aguarde um momento."
          );
        }

        const user = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
        if (!user[0]) {
          await recordFailedAttempt(ctx.req, db);
          throw new Error("Usuario ou senha incorretos");
        }

        const valid = await verifyPassword(input.password, user[0].password);
        if (!valid) {
          await recordFailedAttempt(ctx.req, db);
          throw new Error("Usuario ou senha incorretos");
        }

        await clearAttempts(ctx.req, db);
        const token = await createToken({ userId: user[0].id, username: user[0].username }, ctx.env);
        setTokenCookie(ctx.resHeaders, token);

        const { password: _pw, ...userWithoutPassword } = user[0];
        return { user: userWithoutPassword };
      }),

    register: publicQuery
      .input(z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, numeros e underscore"),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100),
        avatar: z.string().optional(),
        workStartTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
        workEndTime: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
        lunchDuration: z.number().min(15).max(180).default(60),
        dailyTarget: z.number().min(60).max(1440).default(528),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const hashedPassword = await hashPassword(input.password);
        try {
          const result = await db.insert(users).values({
            ...input,
            password: hashedPassword,
            company: "",
            role: "",
          }).returning();
          const { password: _pw, ...userWithoutPassword } = result[0];
          return userWithoutPassword;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "";
          console.error("[auth.register error]", err);
          if (message.includes("UNIQUE constraint failed") || message.includes("unique constraint")) {
            throw new Error("Este nome de usuario ja esta em uso");
          }
          if (message.includes("Cannot read properties of undefined") || message.includes("undefined")) {
            throw new Error("Erro de configuracao do banco de dados. Contate o administrador.");
          }
          throw new Error("Erro ao criar conta: " + message);
        }
      }),

    me: authedQuery.query(async ({ ctx }) => {
      const db = createDb(ctx.env.DB);
      const user = await db.select().from(users).where(eq(users.id, ctx.user!.userId)).limit(1);
      if (!user[0]) throw new Error("Usuario nao encontrado");
      const { password: _pw, ...userWithoutPassword } = user[0];
      return userWithoutPassword;
    }),

    changePassword: authedQuery
      .input(z.object({
        currentPassword: z.string().min(6).max(100),
        newPassword: z.string().min(6).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const user = await db.select().from(users).where(eq(users.id, ctx.user!.userId)).limit(1);
        if (!user[0]) throw new Error("Usuario nao encontrado");

        const valid = await verifyPassword(input.currentPassword, user[0].password);
        if (!valid) throw new Error("Senha atual incorreta");

        const hashedNewPassword = await hashPassword(input.newPassword);
        await db.update(users)
          .set({ password: hashedNewPassword })
          .where(eq(users.id, ctx.user!.userId));

        const token = await createToken({ userId: user[0].id, username: user[0].username }, ctx.env);
        setTokenCookie(ctx.resHeaders, token);
        return { success: true };
      }),
  }),

  // ===== USERS =====
  user: createRouter({
    get: publicQuery.query(async ({ ctx }) => {
      const db = createDb(ctx.env.DB);
      const result = await db.select().from(users).limit(1);
      if (!result[0]) return null;
      const { password: _pw, ...userWithoutPassword } = result[0];
      return userWithoutPassword;
    }),

    create: publicQuery
      .input(z.object({
        username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, numeros e underscore"),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100),
        avatar: z.string().optional(),
        workStartTime: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
        workEndTime: z.string().regex(/^\d{2}:\d{2}$/).default("17:00"),
        lunchDuration: z.number().min(15).max(180).default(60),
        dailyTarget: z.number().min(60).max(1440).default(528),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        const hashedPassword = await hashPassword(input.password);
        try {
          const result = await db.insert(users).values({
            ...input,
            password: hashedPassword,
            company: "",
            role: "",
          }).returning();
          const { password: _pw, ...userWithoutPassword } = result[0];
          return userWithoutPassword;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "";
          if (message.includes("UNIQUE constraint failed") || message.includes("unique constraint")) {
            throw new Error("Este nome de usuario ja esta em uso");
          }
          throw new Error("Erro ao criar conta. Tente novamente.");
        }
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
        const result = await db.update(timeEntries)
          .set(data)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, ctx.user!.userId)))
          .returning();
        if (result.length === 0) throw new Error("Registro nao encontrado ou acesso negado");
        return result[0];
      }),

    delete: authedQuery
      .input(z.object({ id: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = createDb(ctx.env.DB);
        await db.delete(timeEntries)
          .where(and(eq(timeEntries.id, input.id), eq(timeEntries.userId, ctx.user!.userId)));
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
        return db.select().from(timeEntries)
          .where(and(
            eq(timeEntries.userId, ctx.user!.userId),
            like(timeEntries.date, `${prefix}%`)
          ))
          .orderBy(desc(timeEntries.timestamp));
      }),
  }),
});

export type AppRouter = typeof appRouter;
