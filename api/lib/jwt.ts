/**
 * JWT Utilities - PontoCerto Security Module
 *
 * STRICT REQUIREMENTS:
 * - JWT_SECRET MUST be set in environment variables
 * - NO fallback secret (fails loudly if missing)
 * - HS256 algorithm only
 * - 7-day expiration
 */
import { SignJWT, jwtVerify } from "jose";

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JwtError";
  }
}

function getSecretKey(env?: { JWT_SECRET?: string }): Uint8Array {
  const secret = env?.JWT_SECRET;
  if (!secret) {
    throw new JwtError(
      "JWT_SECRET environment variable is required. " +
        "Set it in Cloudflare Dashboard > Workers & Pages > Your Project > Settings > Environment Variables"
    );
  }
  if (secret.length < 32) {
    throw new JwtError("JWT_SECRET must be at least 32 characters long for security");
  }
  return new TextEncoder().encode(secret);
}

export interface TokenPayload {
  userId: number;
  username: string;
}

export async function createToken(
  payload: TokenPayload,
  env?: { JWT_SECRET?: string }
): Promise<string> {
  const secret = getSecretKey(env);
  return new SignJWT({ userId: payload.userId, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setAudience("pontocerto")
    .setIssuer("pontocerto-api")
    .sign(secret);
}

export async function verifyToken(
  token: string,
  env?: { JWT_SECRET?: string }
): Promise<TokenPayload | null> {
  try {
    const secret = getSecretKey(env);
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: 60,
      audience: "pontocerto",
      issuer: "pontocerto-api",
    });
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}
