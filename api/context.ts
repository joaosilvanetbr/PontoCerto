import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyToken } from "./lib/jwt";

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  env: Env;
  user?: { userId: number; username: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env?: Env,
): Promise<TrpcContext> {
  const safeEnv = env ?? { DB: undefined as unknown as D1Database };

  let user = undefined;

  // Try cookie first (httpOnly cookie set by login endpoint)
  const cookieHeader = opts.req.headers.get("cookie") || "";
  let token: string | null = null;

  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)pontocerto_token=([^;]*)/);
    if (match) token = match[1];
  }

  // Fallback: Authorization header (for backwards compatibility during migration)
  if (!token) {
    const auth = opts.req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      token = auth.slice(7);
    }
  }

  if (token) {
    const payload = await verifyToken(token, safeEnv);
    if (payload) {
      user = payload;
    }
  }

  return {
    req: opts.req,
    resHeaders: opts.resHeaders,
    env: safeEnv,
    user,
  };
}
