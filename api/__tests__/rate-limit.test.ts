import { describe, it, expect } from "vitest";
import { createMockD1, createMockEnv } from "./helpers";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "../lib/rate-limit";

describe("Rate Limit", () => {
  it("should allow first request", async () => {
    const req = new Request("http://localhost/api/trpc");
    const result = await checkRateLimit(req, createMockD1());
    expect(result.allowed).toBe(true);
  });

  it("should allow requests within limit", async () => {
    const req = new Request("http://localhost/api/trpc");
    const result = await checkRateLimit(req, createMockD1());
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });
});
