import { describe, it, expect } from "vitest";
import { createContext } from "../context";
import { createMockEnv } from "./helpers";

describe("createContext", () => {
  it("should create context without user when no auth", async () => {
    const req = new Request("http://localhost/api/trpc");
    const ctx = await createContext(
      { req, resHeaders: new Headers(), path: "/api/trpc" } as any,
      createMockEnv()
    );
    expect(ctx.user).toBeUndefined();
    expect(ctx.env).toBeDefined();
  });

  it("should extract user from cookie", async () => {
    const { createToken } = await import("../lib/jwt");
    const token = await createToken({ userId: 1, username: "test" }, createMockEnv());
    const req = new Request("http://localhost/api/trpc", {
      headers: { cookie: `pontocerto_token=${token}` },
    });
    const ctx = await createContext(
      { req, resHeaders: new Headers(), path: "/api/trpc" } as any,
      createMockEnv()
    );
    expect(ctx.user).toBeDefined();
    expect(ctx.user!.userId).toBe(1);
    expect(ctx.user!.username).toBe("test");
  });
});
