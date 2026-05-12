import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../backend/api/router";
import { createContext } from "../../../backend/api/context";
import { getSecurityHeaders, handleCors } from "../../../backend/api/lib/security";

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsResponse = handleCors(context.request);
  if (corsResponse) return corsResponse;

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: context.request,
      router: appRouter,
      createContext: (opts) => createContext(opts, context.env),
    });

    const securityHeaders = getSecurityHeaders(context.request);
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  } catch (err) {
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
