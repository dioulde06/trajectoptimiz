import { z } from "zod";

/* Schema de création : champs fournis par le client */
export const CreateUserSchema = z.object({
  email: z
    .string()
    .email("L'adresse email est invalide")
    .min(1, "L'email est requis"),
});

/* Schema complet : entité telle que retournée par la base de données */
export const UserSchema = CreateUserSchema.extend({
  id: z.string().cuid("L'identifiant doit être un CUID valide"),
  createdAt: z.date(),
});

/* Schema de mise à jour : tous les champs sont optionnels */
export const UpdateUserSchema = CreateUserSchema.partial();

/* Types inférés — jamais écrits à la main */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type User = z.infer<typeof UserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
