import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async fetch(url, options) {
            const response = await fetch(url, { ...options, credentials: "include" });
            const contentType = response.headers.get("content-type") || "";

            // tRPC responses must be JSON; if deploy/routing returns HTML or empty content,
            // fail with a friendly connectivity error instead of raw JSON.parse messages.
            if (!contentType.includes("application/json")) {
              throw new Error("Nao foi possivel conectar ao servidor. Verifique o deploy da API.");
            }

            return response;
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
