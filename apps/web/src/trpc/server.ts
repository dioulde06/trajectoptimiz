import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@trajectoptimiz/api";

/**
 * Client tRPC pour les Server Components Next.js.
 * Utilise des requêtes HTTP directes vers le handler tRPC de l'app.
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      // URL absolue requise pour les Server Components
      url: `${process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
