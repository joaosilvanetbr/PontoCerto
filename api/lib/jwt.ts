import { SignJWT, jwtVerify } from "jose";

// Secret key for JWT signing - uses env variable or fallback for dev
function getSecretKey(env?: { JWT_SECRET?: string }) {
  const secret = env?.JWT_SECRET || "pontocerto-dev-secret-key-2026-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: { userId: number; pin: string }, env?: { JWT_SECRET?: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setAudience("pontocerto")
    .setIssuer("pontocerto-api")
    .sign(getSecretKey(env));
}

export async function verifyToken(token: string, env?: { JWT_SECRET?: string }) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(env), {
      clockTolerance: 60,
      audience: "pontocerto",
      issuer: "pontocerto-api",
    });
    return payload as { userId: number; pin: string };
  } catch {
    return null;
  }
}
