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
  user?: { userId: number; pin: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env?: Env,
): Promise<TrpcContext> {
  const safeEnv = env ?? { DB: undefined as unknown as D1Database };

  // Try to extract and verify JWT from Authorization header
  const authHeader = opts.req.headers.get("authorization");
  let user = undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
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
