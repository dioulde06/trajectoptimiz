/* Export barrel du package db */

// Client Prisma singleton
export { prisma } from "./client";

// Re-export des types Prisma générés pour éviter aux consommateurs
// d'importer directement depuis @prisma/client
export type {
  User,
  Route,
  TripHistory,
  Prisma,
} from "@prisma/client";
