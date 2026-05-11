import { describe, it, expect } from "vitest";
import { createToken, verifyToken, JwtError } from "../lib/jwt";

const mockEnv = { JWT_SECRET: "test-secret-key-that-is-at-least-32-chars!" };

describe("JWT", () => {
  it("should create a valid token", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("should verify a valid token", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    const payload = await verifyToken(token, mockEnv);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(1);
    expect(payload!.username).toBe("test");
  });

  it("should reject an invalid token", async () => {
    const payload = await verifyToken("invalid.token.here", mockEnv);
    expect(payload).toBeNull();
  });

  it("should reject token with wrong secret", async () => {
    const token = await createToken({ userId: 1, username: "test" }, mockEnv);
    const wrongEnv = { JWT_SECRET: "different-secret-key-that-is-also-32-chars!" };
    const payload = await verifyToken(token, wrongEnv);
    expect(payload).toBeNull();
  });

  it("should throw if JWT_SECRET is missing", async () => {
    await expect(createToken({ userId: 1, username: "test" }, {}))
      .rejects.toThrow(JwtError);
  });

  it("should throw if JWT_SECRET is too short", async () => {
    await expect(createToken({ userId: 1, username: "test" }, { JWT_SECRET: "short" }))
      .rejects.toThrow(JwtError);
  });
});
