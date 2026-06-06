import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { PrismaClient } from "@prisma/client";

/* Forme du contexte injecté dans chaque procédure */
export interface TRPCContext {
  prisma: PrismaClient;
  // userId sera renseigné une fois l'authentification ajoutée
  userId: string | null;
}

/* Initialisation de tRPC avec le contexte et superjson */
const t = initTRPC.context<TRPCContext>().create({
  // superjson sérialise Date, BigInt, Map, Set — indispensable pour scheduledAt/createdAt
  transformer: superjson,

  // Formate les erreurs Zod en messages lisibles côté client
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/* Constructeurs exportés */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/* Middleware d'authentification — vérifie la présence d'un userId dans le contexte */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Vous devez être connecté pour effectuer cette action",
    });
  }
  // Après ce middleware, ctx.userId est garanti non-null
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
