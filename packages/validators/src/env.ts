import { z } from "zod";

/* Schema des variables d'environnement serveur */
const ServerEnvSchema = z.object({
  /* Base de données PostgreSQL */
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL doit être une URL valide")
    .startsWith("postgresql://", "DATABASE_URL doit commencer par postgresql://"),

  /* Anthropic Claude API */
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY est requise")
    .startsWith("sk-ant-", "ANTHROPIC_API_KEY doit commencer par sk-ant-"),

  /* Environnement d'exécution */
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

/* Schema des variables exposées côté client Next.js (préfixe NEXT_PUBLIC_) */
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL doit être une URL valide")
    .default("http://localhost:3000"),
});

/* Types inférés */
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;

/**
 * Valide et retourne les variables d'environnement serveur.
 * Lève une erreur descriptive au démarrage si une variable manque ou est invalide.
 */
export function validateServerEnv(env: NodeJS.ProcessEnv): ServerEnv {
  const result = ServerEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variables d'environnement invalides :\n${formatted}\n\nVérifiez votre fichier .env`
    );
  }

  return result.data;
}

/**
 * Valide et retourne les variables d'environnement client.
 */
export function validateClientEnv(env: Record<string, string | undefined>): ClientEnv {
  const result = ClientEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variables d'environnement client invalides :\n${formatted}`
    );
  }

  return result.data;
}
