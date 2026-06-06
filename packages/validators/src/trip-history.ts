import { z } from "zod";

export const CreateTripHistorySchema = z.object({
  routeId: z.string().cuid("L'identifiant du trajet doit être un CUID valide"),

  /* Heure théorique selon l'horaire officiel */
  scheduledAt: z.date({
    required_error: "L'heure planifiée est requise",
    invalid_type_error: "L'heure planifiée doit être une date valide",
  }),

  /* Heure réelle de passage — null si le trajet n'a pas encore eu lieu */
  actualAt: z.date().nullable().optional(),

  /* Retard en minutes — négatif = avance, 0 = à l'heure, positif = retard */
  delayMinutes: z
    .number()
    .int("Le retard doit être un nombre entier de minutes")
    .min(-60, "Une avance de plus d'une heure est improbable")
    .max(300, "Un retard de plus de 5 heures est improbable")
    .nullable()
    .optional(),
});

export const TripHistorySchema = CreateTripHistorySchema.extend({
  id: z.string().cuid(),
  createdAt: z.date(),
});

/* Schema pour l'analyse IA — résumé d'un historique de trajets */
export const RouteHistorySchema = z.object({
  routeId: z.string().cuid(),
  routeName: z.string(),
  fromStop: z.string(),
  toStop: z.string(),
  trips: z.array(
    z.object({
      scheduledAt: z.date(),
      actualAt: z.date().nullable(),
      delayMinutes: z.number().nullable(),
    })
  ),
});

export type CreateTripHistoryInput = z.infer<typeof CreateTripHistorySchema>;
export type TripHistory = z.infer<typeof TripHistorySchema>;
export type RouteHistory = z.infer<typeof RouteHistorySchema>;
