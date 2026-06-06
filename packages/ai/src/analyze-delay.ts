import { z } from "zod";
import type { RouteHistory } from "@trajectoptimiz/validators";
import { anthropic } from "./client";

/* Schema de la réponse JSON attendue de Claude */
const DelayAnalysisSchema = z.object({
  // Probabilité de retard en pourcentage (0–100)
  delayProbability: z
    .number()
    .min(0)
    .max(100)
    .describe("Probabilité de retard en pourcentage"),

  // Retard moyen prédit en minutes
  predictedDelayMinutes: z
    .number()
    .describe("Retard moyen prédit en minutes (négatif = avance probable)"),

  // Niveau de confiance de l'analyse
  confidenceLevel: z
    .enum(["faible", "moyen", "élevé"])
    .describe("Niveau de confiance de la prédiction"),

  // Facteurs identifiés influençant le retard
  factors: z
    .array(z.string())
    .describe("Facteurs identifiés influençant le retard"),

  // Recommandation pour le voyageur
  recommendation: z
    .string()
    .describe("Recommandation pour le voyageur"),
});

export type DelayAnalysis = z.infer<typeof DelayAnalysisSchema>;

/**
 * Formate l'historique des trajets en tableau lisible pour Claude.
 * Retourne une chaîne de caractères décrivant les données historiques.
 */
function formatRouteHistory(history: RouteHistory): string {
  const tripLines = history.trips
    .map((trip, index) => {
      const scheduled = trip.scheduledAt.toLocaleString("fr-FR", {
        timeZone: "Europe/Berlin",
        dateStyle: "short",
        timeStyle: "short",
      });

      const delayInfo =
        trip.delayMinutes !== null && trip.delayMinutes !== undefined
          ? trip.delayMinutes > 0
            ? `${trip.delayMinutes} min de retard`
            : trip.delayMinutes < 0
              ? `${Math.abs(trip.delayMinutes)} min d'avance`
              : "à l'heure"
          : "données indisponibles";

      return `  ${index + 1}. Prévu: ${scheduled} | ${delayInfo}`;
    })
    .join("\n");

  return `
Trajet: ${history.routeName}
De: ${history.fromStop} → Vers: ${history.toStop}
Nombre de voyages analysés: ${history.trips.length}

Historique des voyages:
${tripLines}
  `.trim();
}

/**
 * Analyse l'historique d'un trajet avec Claude pour prédire
 * la probabilité de retard sur le prochain voyage.
 *
 * Utilise claude-opus-4-8 avec thinking adaptatif pour une analyse précise.
 */
export async function analyzeDelay(routeHistory: RouteHistory): Promise<DelayAnalysis> {
  if (routeHistory.trips.length === 0) {
    // Pas assez de données historiques — retourne une analyse par défaut
    return {
      delayProbability: 50,
      predictedDelayMinutes: 0,
      confidenceLevel: "faible",
      factors: ["Historique insuffisant pour une analyse fiable"],
      recommendation:
        "Prévoyez une marge de 10 minutes en raison du manque de données historiques.",
    };
  }

  const formattedHistory = formatRouteHistory(routeHistory);

  const prompt = `Tu es un expert en analyse des transports en commun dans la région Saarbrücken-Neunkirchen (Allemagne).

Analyse l'historique de ponctualité du trajet suivant et génère une prédiction de retard pour le prochain voyage.

${formattedHistory}

Réponds UNIQUEMENT avec un objet JSON valide respectant exactement ce schéma (pas de texte avant ni après) :
{
  "delayProbability": <nombre entre 0 et 100>,
  "predictedDelayMinutes": <nombre entier, négatif si avance probable>,
  "confidenceLevel": <"faible" | "moyen" | "élevé">,
  "factors": [<liste de facteurs identifiés comme strings>],
  "recommendation": "<conseil pratique pour le voyageur>"
}

Prends en compte : les tendances historiques, les patterns horaires (heure de pointe), et les spécificités des lignes S-Bahn sarroise.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    // Thinking adaptatif pour une meilleure analyse des patterns de retard
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extrait le texte de la réponse — Claude peut retourner plusieurs blocs
  const textContent = response.content.find((block) => block.type === "text");

  if (!textContent || textContent.type !== "text") {
    throw new Error(
      "Claude n'a pas retourné de réponse textuelle. " +
        `Stop reason: ${response.stop_reason}`
    );
  }

  // Parse et valide le JSON retourné par Claude
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(textContent.text.trim());
  } catch {
    throw new Error(
      `Claude n'a pas retourné du JSON valide.\nRéponse reçue:\n${textContent.text}`
    );
  }

  const validation = DelayAnalysisSchema.safeParse(rawJson);

  if (!validation.success) {
    const errors = validation.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `La réponse de Claude ne correspond pas au schéma attendu:\n${errors}\n` +
        `Réponse brute:\n${textContent.text}`
    );
  }

  return validation.data;
}
