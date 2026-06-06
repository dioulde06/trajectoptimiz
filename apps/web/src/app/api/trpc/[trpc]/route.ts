import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@trajectoptimiz/api";
import { prisma } from "@trajectoptimiz/db";
import type { TRPCContext } from "@trajectoptimiz/api";

/**
 * Handler tRPC pour Next.js 15 App Router.
 * Utilise l'adapter fetch (compatible Edge + Node.js).
 */
function createContext(): TRPCContext {
  return {
    prisma,
    // userId sera extrait du cookie/session une fois l'auth ajoutée
    userId: null,
  };
}

// path est string | undefined dans HTTPErrorHandlerOptions — pas une prop optionnelle
function devErrorLogger({ path, error }: { path: string | undefined; error: unknown }): void {
  console.error(`tRPC error on ${path ?? "unknown"}:`, error);
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    ...(process.env["NODE_ENV"] === "development" && { onError: devErrorLogger }),
  });

export { handler as GET, handler as POST };
