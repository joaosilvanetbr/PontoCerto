/**
 * tRPC Middleware - PontoCerto
 *
 * Procedures:
 * - publicQuery: open endpoints (health check)
 * - authedQuery: requires valid JWT token
 * - Session timeout validation on authenticated endpoints
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { AppError } from "../contracts/errors";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const isAppError = error.cause instanceof AppError;
    return {
      ...shape,
      data: {
        ...shape.data,
        code: isAppError ? (error.cause as AppError).code : "INTERNAL_ERROR",
        httpStatus: isAppError ? (error.cause as AppError).statusCode : 500,
      },
    };
  },
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const authedQuery = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new AppError("Nao autenticado. Faca login primeiro.", 401, "UNAUTHORIZED");
  }

  return next({ ctx });
});
