import { createTRPCRouter } from "./trpc";
import { routesRouter } from "./routers/routes";

/* Router racine — agrège tous les sous-routers de l'application */
export const appRouter = createTRPCRouter({
  routes: routesRouter,
});

/* Type exporté vers apps/web pour l'inférence côté client */
export type AppRouter = typeof appRouter;

/* Re-exports utiles pour les consommateurs du package */
export { createTRPCRouter, publicProcedure, protectedProcedure, createCallerFactory } from "./trpc";
export type { TRPCContext } from "./trpc";
