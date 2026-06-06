import { PrismaClient } from "@prisma/client";
import "./env"; // Déclenche la validation des variables d'environnement

// Clé utilisée pour stocker le singleton sur l'objet global en développement.
// En production, chaque requête Next.js tourne dans un contexte isolé — pas besoin du singleton.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  // Réutilise la même instance entre les rechargements à chaud (Next.js dev)
  globalForPrisma.prisma = prisma;
}
