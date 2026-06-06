import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Début du seed de la base de données...");

  // Nettoyage dans l'ordre des dépendances pour éviter les contraintes FK
  await prisma.tripHistory.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  // Utilisateur de démonstration
  const user = await prisma.user.create({
    data: {
      email: "demo@trajectoptimiz.de",
    },
  });

  console.log(`Utilisateur créé : ${user.email} (${user.id})`);

  // Trajet principal : Dudweiler → Neunkirchen via la S1
  const route = await prisma.route.create({
    data: {
      name: "Dudweiler → Neunkirchen (S1)",
      fromStop: "Dudweiler Markt",
      toStop: "Neunkirchen Hauptbahnhof",
      userId: user.id,
    },
  });

  console.log(`Trajet créé : ${route.name} (${route.id})`);

  // Historique des 5 derniers jours avec des retards réalistes
  const now = new Date();
  const tripData = Array.from({ length: 10 }, (_, i) => {
    const scheduledAt = new Date(now);
    // Voyages répartis sur les 5 derniers jours, 2 par jour
    scheduledAt.setDate(scheduledAt.getDate() - Math.floor(i / 2));
    scheduledAt.setHours(i % 2 === 0 ? 8 : 17, 15, 0, 0);

    // Retard aléatoire entre -2 et 12 minutes
    const delayMinutes = Math.floor(Math.random() * 15) - 2;
    const actualAt = new Date(scheduledAt.getTime() + delayMinutes * 60 * 1000);

    return {
      routeId: route.id,
      scheduledAt,
      actualAt,
      delayMinutes,
    };
  });

  await prisma.tripHistory.createMany({ data: tripData });

  console.log(`${tripData.length} voyages créés dans l'historique`);
  console.log("Seed terminé avec succès !");
}

main()
  .catch((error: unknown) => {
    console.error("Erreur lors du seed :", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
