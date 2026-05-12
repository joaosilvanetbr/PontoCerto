import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { handleCors, getSecurityHeaders } from "./lib/security";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.use("/api/*", async (c) => {
  const corsResp = handleCors(c.req.raw);
  if (corsResp) return corsResp;

  let res: Response;
  if (c.req.path.startsWith("/api/trpc")) {
    res = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext: (opts) => createContext(opts, { DB: c.env?.DB, JWT_SECRET: process.env.JWT_SECRET }),
    });
  } else {
    res = c.json({ error: "Not Found" }, 404);
  }

  const headers = getSecurityHeaders(c.req.raw);
  for (const [k, v] of Object.entries(headers)) {
    res.headers.set(k, v);
  }
  return res;
});

export default app;

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
