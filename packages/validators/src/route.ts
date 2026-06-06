import { z } from "zod";

/* Arrêts connus sur le trajet Dudweiler → Neunkirchen */
export const KNOWN_STOPS = [
  "Dudweiler Markt",
  "Dudweiler Poststraße",
  "Saarbrücken Hauptbahnhof",
  "Saarbrücken Ost",
  "Scheidt",
  "Quierschied",
  "Friedrichsthal",
  "Sulzbach",
  "Neunkirchen Hauptbahnhof",
  "Neunkirchen Stadtmitte",
] as const;

export const StopSchema = z.enum(KNOWN_STOPS);

export const CreateRouteSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du trajet est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  fromStop: z.string().min(1, "L'arrêt de départ est requis"),
  toStop: z.string().min(1, "L'arrêt d'arrivée est requis"),
  userId: z.string().cuid("L'identifiant utilisateur doit être un CUID valide"),
});

export const RouteSchema = CreateRouteSchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
});

export const UpdateRouteSchema = CreateRouteSchema.omit({ userId: true }).partial();

/* Paramètres des procédures tRPC */
export const RouteByIdSchema = z.object({
  id: z.string().cuid("L'identifiant du trajet doit être un CUID valide"),
});

export const RoutesByUserSchema = z.object({
  userId: z.string().cuid("L'identifiant utilisateur doit être un CUID valide"),
});

export type KnownStop = z.infer<typeof StopSchema>;
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
