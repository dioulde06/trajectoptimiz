import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CreateRouteSchema,
  RouteByIdSchema,
  RoutesByUserSchema,
} from "@trajectoptimiz/validators";
import { analyzeDelay } from "@trajectoptimiz/ai";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const routesRouter = createTRPCRouter({
  /* Liste tous les trajets sauvegardés d'un utilisateur */
  getAll: publicProcedure
    .input(RoutesByUserSchema)
    .query(async ({ ctx, input }) => {
      const routes = await ctx.prisma.route.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          // Compte le nombre de voyages dans l'historique sans les charger tous
          _count: { select: { tripHistories: true } },
        },
      });

      return routes;
    }),

  /* Crée un nouveau trajet après validation Zod */
  create: publicProcedure
    .input(CreateRouteSchema)
    .mutation(async ({ ctx, input }) => {
      // Vérifie qu'un trajet identique n'existe pas déjà pour cet utilisateur
      const existing = await ctx.prisma.route.findFirst({
        where: {
          userId: input.userId,
          fromStop: input.fromStop,
          toStop: input.toStop,
        },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Un trajet de "${input.fromStop}" à "${input.toStop}" existe déjà`,
        });
      }

      // connectOrCreate crée l'utilisateur démo s'il n'existe pas encore
      const route = await ctx.prisma.route.create({
        data: {
          name: input.name,
          fromStop: input.fromStop,
          toStop: input.toStop,
          user: {
            connectOrCreate: {
              where: { id: input.userId },
              create: { id: input.userId, email: "demo@trajectoptimiz.local" },
            },
          },
        },
      });

      return route;
    }),

  /* Analyse l'historique d'un trajet avec Claude pour prédire les retards */
  analyzeDelay: publicProcedure
    .input(z.object({ routeId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.routeId },
        include: {
          tripHistories: {
            orderBy: { scheduledAt: "desc" },
            take: 20,
          },
        },
      });

      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Trajet ${input.routeId} introuvable`,
        });
      }

      return analyzeDelay({
        routeId: route.id,
        routeName: route.name,
        fromStop: route.fromStop,
        toStop: route.toStop,
        trips: route.tripHistories.map((t) => ({
          scheduledAt: t.scheduledAt,
          actualAt: t.actualAt,
          delayMinutes: t.delayMinutes,
        })),
      });
    }),

  /* Supprime un trajet par son identifiant */
  delete: publicProcedure
    .input(RouteByIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Vérifie que le trajet existe avant de tenter la suppression
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.id },
        select: { id: true, name: true },
      });

      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Aucun trajet trouvé avec l'identifiant ${input.id}`,
        });
      }

      await ctx.prisma.route.delete({ where: { id: input.id } });

      // Retourne l'id supprimé pour que le client puisse mettre à jour son cache
      return { id: input.id };
    }),
});
