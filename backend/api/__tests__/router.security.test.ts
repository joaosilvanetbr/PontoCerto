import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../router";
import { createMockContext } from "./helpers";

const createDbMock = vi.fn();

vi.mock("../../db/connection", () => ({
  createDb: (...args: unknown[]) => createDbMock(...args),
}));

function createCaller(userId = 1) {
  return appRouter.createCaller(createMockContext({
    user: { userId, username: `user-${userId}` },
  }));
}

function createDbWithSelectQueue(
  queue: Array<{ limit?: any[]; orderBy?: any[] }>,
  options?: {
    updateReturning?: any[];
    deleteRun?: () => Promise<void>;
  }
) {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const next = queue.shift() ?? {};
          return {
            limit: async () => next.limit ?? [],
            orderBy: async () => next.orderBy ?? [],
          };
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => options?.updateReturning ?? [],
        }),
      }),
    }),
    delete: () => ({
      where: async () => {
        if (options?.deleteRun) await options.deleteRun();
      },
    }),
  };
}

describe("router security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auth.login should not return password", async () => {
    createDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{
              id: 1,
              username: "alice",
              password: "hashed-value",
              name: "Alice",
              company: "",
              role: "",
            }],
          }),
        }),
      }),
    });

    const rateLimit = await import("../lib/rate-limit");
    vi.spyOn(rateLimit, "checkRateLimit").mockResolvedValue({ allowed: true, remaining: 4, resetIn: 0, blocked: false });
    vi.spyOn(rateLimit, "clearAttempts").mockResolvedValue(undefined);
    vi.spyOn(rateLimit, "recordFailedAttempt").mockResolvedValue(undefined);

    const hash = await import("../lib/hash");
    vi.spyOn(hash, "verifyPassword").mockResolvedValue(true);

    const jwt = await import("../lib/jwt");
    vi.spyOn(jwt, "createToken").mockResolvedValue("token-value");

    const caller = createCaller();
    const result = await caller.auth.login({ username: "alice", password: "123456" });

    expect(result.user).toBeDefined();
    expect((result.user as Record<string, unknown>).password).toBeUndefined();
  });

  it("auth.register, auth.me and user.update should not return password", async () => {
    createDbMock.mockReturnValue({
      insert: () => ({
        values: () => ({
          returning: async () => [{
            id: 1,
            username: "alice",
            password: "hashed-value",
            name: "Alice",
            company: "",
            role: "",
            avatar: "",
            workStartTime: "08:00",
            workEndTime: "17:00",
            lunchDuration: 60,
            dailyTarget: 528,
          }],
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{
              id: 1,
              username: "alice",
              password: "hashed-value",
              name: "Alice",
              company: "",
              role: "",
              avatar: "",
              workStartTime: "08:00",
              workEndTime: "17:00",
              lunchDuration: 60,
              dailyTarget: 528,
            }],
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: async () => [{
              id: 1,
              username: "alice",
              password: "hashed-value",
              name: "Alice Updated",
              company: "",
              role: "",
              avatar: "",
              workStartTime: "08:00",
              workEndTime: "17:00",
              lunchDuration: 60,
              dailyTarget: 528,
            }],
          }),
        }),
      }),
    });

    const hash = await import("../lib/hash");
    vi.spyOn(hash, "hashPassword").mockResolvedValue("hashed-value");

    const caller = createCaller();
    const registered = await caller.auth.register({
      username: "alice",
      password: "123456",
      name: "Alice",
      avatar: "",
      workStartTime: "08:00",
      workEndTime: "17:00",
      lunchDuration: 60,
      dailyTarget: 528,
    });
    const me = await caller.auth.me();
    const updated = await caller.user.update({ name: "Alice Updated" });

    expect((registered as Record<string, unknown>).password).toBeUndefined();
    expect((me as Record<string, unknown>).password).toBeUndefined();
    expect((updated as Record<string, unknown>).password).toBeUndefined();
  });

  it("entry.create should enforce valid sequence", async () => {
    createDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
          }),
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: async () => [{
            id: 1,
            userId: 1,
            type: "in",
            timestamp: 1,
            date: "2026-05-12",
          }],
        }),
      }),
    });

    const caller = createCaller();

    await expect(caller.entry.create({
      type: "out",
      timestamp: 1,
      date: "2026-05-12",
    })).rejects.toThrow("Sequencia de ponto invalida");

    await expect(caller.entry.create({
      type: "in",
      timestamp: 1,
      date: "2026-05-12",
    })).resolves.toBeDefined();
  });

  it("entry.create should block new entries after out", async () => {
    createDbMock.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [{
              id: 1,
              userId: 1,
              type: "out",
              timestamp: 2,
              date: "2026-05-12",
            }],
          }),
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: async () => [],
        }),
      }),
    });

    const caller = createCaller();
    await expect(caller.entry.create({
      type: "in",
      timestamp: 3,
      date: "2026-05-12",
    })).rejects.toThrow("Sequencia de ponto invalida");
  });

  it("entry.update should reject sequence-breaking update", async () => {
    createDbMock.mockReturnValue(createDbWithSelectQueue(
      [
        {
          limit: [{
            id: 10,
            userId: 1,
            type: "lunch-out",
            timestamp: 100,
            date: "2026-05-12",
          }],
        },
        {
          orderBy: [
            { id: 1, userId: 1, type: "in", timestamp: 10, date: "2026-05-12" },
            { id: 10, userId: 1, type: "lunch-out", timestamp: 100, date: "2026-05-12" },
            { id: 3, userId: 1, type: "lunch-in", timestamp: 200, date: "2026-05-12" },
            { id: 4, userId: 1, type: "out", timestamp: 300, date: "2026-05-12" },
          ],
        },
      ],
      {
        updateReturning: [{
          id: 10,
          userId: 1,
          type: "lunch-out",
          timestamp: 5,
          date: "2026-05-12",
        }],
      }
    ));

    const caller = createCaller();
    await expect(caller.entry.update({
      id: 10,
      timestamp: 5,
      date: "2026-05-12",
    })).rejects.toThrow("Atualizacao invalida");
  });

  it("entry.update should accept valid update", async () => {
    createDbMock.mockReturnValue(createDbWithSelectQueue(
      [
        {
          limit: [{
            id: 10,
            userId: 1,
            type: "lunch-out",
            timestamp: 100,
            date: "2026-05-12",
          }],
        },
        {
          orderBy: [
            { id: 1, userId: 1, type: "in", timestamp: 10, date: "2026-05-12" },
            { id: 10, userId: 1, type: "lunch-out", timestamp: 100, date: "2026-05-12" },
            { id: 3, userId: 1, type: "lunch-in", timestamp: 200, date: "2026-05-12" },
            { id: 4, userId: 1, type: "out", timestamp: 300, date: "2026-05-12" },
          ],
        },
      ],
      {
        updateReturning: [{
          id: 10,
          userId: 1,
          type: "lunch-out",
          timestamp: 120,
          date: "2026-05-12",
        }],
      }
    ));

    const caller = createCaller();
    await expect(caller.entry.update({
      id: 10,
      timestamp: 120,
      date: "2026-05-12",
    })).resolves.toBeDefined();
  });

  it("entry.delete should reject sequence-breaking deletion", async () => {
    createDbMock.mockReturnValue(createDbWithSelectQueue([
      {
        limit: [{
          id: 1,
          userId: 1,
          type: "in",
          timestamp: 10,
          date: "2026-05-12",
        }],
      },
      {
        orderBy: [
          { id: 1, userId: 1, type: "in", timestamp: 10, date: "2026-05-12" },
          { id: 2, userId: 1, type: "lunch-out", timestamp: 100, date: "2026-05-12" },
        ],
      },
    ]));

    const caller = createCaller();
    await expect(caller.entry.delete({ id: 1 })).rejects.toThrow("Exclusao invalida");
  });

  it("entry.delete should allow safe deletion", async () => {
    createDbMock.mockReturnValue(createDbWithSelectQueue(
      [
        {
          limit: [{
            id: 4,
            userId: 1,
            type: "out",
            timestamp: 300,
            date: "2026-05-12",
          }],
        },
        {
          orderBy: [
            { id: 1, userId: 1, type: "in", timestamp: 10, date: "2026-05-12" },
            { id: 2, userId: 1, type: "lunch-out", timestamp: 100, date: "2026-05-12" },
            { id: 3, userId: 1, type: "lunch-in", timestamp: 200, date: "2026-05-12" },
            { id: 4, userId: 1, type: "out", timestamp: 300, date: "2026-05-12" },
          ],
        },
      ]
    ));

    const caller = createCaller();
    await expect(caller.entry.delete({ id: 4 })).resolves.toEqual({ success: true });
  });
});
