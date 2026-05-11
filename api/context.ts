import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export interface Env {
  DB: D1Database;
}

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  env: Env;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env?: Env,
): Promise<TrpcContext> {
  return { req: opts.req, resHeaders: opts.resHeaders, env: env ?? { DB: undefined as unknown as D1Database } };
}
