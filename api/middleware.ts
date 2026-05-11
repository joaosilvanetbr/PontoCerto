/**
 * tRPC Middleware - PontoCerto
 *
 * Procedures:
 * - publicQuery: open endpoints (health check)
 * - authedQuery: requires valid JWT token
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// Authenticated procedure - requires valid JWT
export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error("Nao autenticado. Faca login primeiro.");
  }
  return next({ ctx });
});
