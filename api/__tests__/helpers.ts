import type { TrpcContext } from "../context";

export function createMockD1(): D1Database {
  return {
    prepare: () => ({
      bind: (...args: any[]) => ({
        run: async () => ({ success: true, meta: {} }),
        all: async () => ({ results: [] }),
        first: async (col?: string) => null,
        raw: async () => [],
      }),
    }),
    batch: async (stmts: any[]) => [],
    exec: async (sql: string) => ({ count: 0 }),
  } as unknown as D1Database;
}

export function createMockEnv(): any {
  return {
    DB: createMockD1(),
    JWT_SECRET: "test-secret-key-at-least-32-chars-long!!",
  };
}

export function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    req: new Request("http://localhost/api/trpc"),
    resHeaders: new Headers(),
    env: createMockEnv(),
    user: { userId: 1, username: "testuser" },
    ...overrides,
  };
}
