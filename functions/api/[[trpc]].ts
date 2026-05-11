/**
 * Cloudflare Pages Function - tRPC Handler
 *
 * Includes security headers on every response:
 * - CORS with strict origin
 * - Content-Security-Policy
 * - X-Frame-Options
 * - HSTS
 * - Rate limiting context
 */
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../api/router";
import { createContext } from "../../api/context";
import { getSecurityHeaders, handleCors } from "../../api/lib/security";

export const onRequest: PagesFunction<Env> = async (context) => {
  // Handle CORS preflight
  const corsResponse = handleCors(context.request);
  if (corsResponse) return corsResponse;

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: context.request,
      router: appRouter,
      createContext: (opts) => createContext(opts, context.env),
    });

    // Add security headers
    const securityHeaders = getSecurityHeaders(context.request);
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  } catch (err) {
    // If fetchRequestHandler throws, we still need CORS headers so the
    // frontend can read the error response (not a opaque CORS failure).
    console.error("[tRPC Error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const response = new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );

    const securityHeaders = getSecurityHeaders(context.request);
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  }
};
