import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/api/router";

export const trpc = createTRPCReact<AppRouter>();
