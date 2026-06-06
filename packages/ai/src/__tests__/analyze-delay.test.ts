import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import type { RouteHistory } from "@trajectoptimiz/validators";
import type { analyzeDelay as AnalyzeDelayFn } from "../analyze-delay";
import type { anthropic as AnthropicClient } from "../client";

/* Mock du client Anthropic avant l'import de la fonction testée */
vi.mock("../client", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

/* vi.mock est hissé automatiquement — imports dynamiques dans beforeAll */
let analyzeDelay: typeof AnalyzeDelayFn;
let anthropic: typeof AnthropicClient;

beforeAll(async () => {
  const analyzeDelayModule = await import("../analyze-delay");
  const clientModule = await import("../client");
  analyzeDelay = analyzeDelayModule.analyzeDelay;
  anthropic = clientModule.anthropic;
});

const HISTORIQUE_VIDE: RouteHistory = {
  routeId: "cjld2cjxh0000qzrmn831i7rn",
  routeName: "Test S1",
  fromStop: "Dudweiler Markt",
  toStop: "Neunkirchen Hauptbahnhof",
  trips: [],
};

const HISTORIQUE_AVEC_VOYAGES: RouteHistory = {
  ...HISTORIQUE_VIDE,
  trips: [
    {
      scheduledAt: new Date("2024-09-01T07:30:00Z"),
      actualAt: new Date("2024-09-01T07:35:00Z"),
      delayMinutes: 5,
    },
    {
      scheduledAt: new Date("2024-09-02T07:30:00Z"),
      actualAt: new Date("2024-09-02T07:33:00Z"),
      delayMinutes: 3,
    },
    {
      scheduledAt: new Date("2024-09-03T07:30:00Z"),
      actualAt: null,
      delayMinutes: null,
    },
  ],
};

/* Réponse JSON simulée de Claude — respecte DelayAnalysisSchema */
const REPONSE_CLAUDE_VALIDE = JSON.stringify({
  delayProbability: 75,
  predictedDelayMinutes: 4,
  confidenceLevel: "élevé",
  factors: ["Heure de pointe matinale", "Tendance historique"],
  recommendation: "Prévoyez 10 minutes de marge supplémentaire.",
});

describe("analyzeDelay — cas historique vide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne l'analyse par défaut sans appeler l'API", async () => {
    const result = await analyzeDelay(HISTORIQUE_VIDE);

    expect(result.delayProbability).toBe(50);
    expect(result.predictedDelayMinutes).toBe(0);
    expect(result.confidenceLevel).toBe("faible");
    expect(result.factors).toHaveLength(1);
    expect(result.recommendation).toBeTypeOf("string");
  });

  it("ne fait aucun appel à l'API Anthropic si 0 voyages", async () => {
    await analyzeDelay(HISTORIQUE_VIDE);

    expect(vi.mocked(anthropic.messages.create)).not.toHaveBeenCalled();
  });
});

describe("analyzeDelay — cas avec historique", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appelle l'API Anthropic avec le bon modèle", async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      id: "msg_test_001",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-8",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 350, output_tokens: 85, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      content: [{ type: "text", text: REPONSE_CLAUDE_VALIDE }],
    } as Awaited<ReturnType<typeof anthropic.messages.create>>);

    await analyzeDelay(HISTORIQUE_AVEC_VOYAGES);

    const appel = vi.mocked(anthropic.messages.create).mock.calls[0]?.[0];
    expect(appel).toBeDefined();
    expect(appel?.model).toBe("claude-opus-4-8");
  });

  it("parse et retourne la réponse JSON de Claude correctement", async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      id: "msg_test_002",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-8",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 350, output_tokens: 85, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      content: [{ type: "text", text: REPONSE_CLAUDE_VALIDE }],
    } as Awaited<ReturnType<typeof anthropic.messages.create>>);

    const result = await analyzeDelay(HISTORIQUE_AVEC_VOYAGES);

    expect(result.delayProbability).toBe(75);
    expect(result.predictedDelayMinutes).toBe(4);
    expect(result.confidenceLevel).toBe("élevé");
    expect(result.factors).toContain("Heure de pointe matinale");
    expect(result.recommendation).toBe("Prévoyez 10 minutes de marge supplémentaire.");
  });

  it("lève une erreur si Claude retourne un JSON invalide", async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      id: "msg_test_003",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-8",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      content: [{ type: "text", text: "Désolé, je ne peux pas analyser cela." }],
    } as Awaited<ReturnType<typeof anthropic.messages.create>>);

    await expect(analyzeDelay(HISTORIQUE_AVEC_VOYAGES)).rejects.toThrow(
      "JSON"
    );
  });

  it("lève une erreur si la réponse Claude ne respecte pas le schéma", async () => {
    const jsonInvalide = JSON.stringify({
      delayProbability: 150, // hors plage 0-100
      predictedDelayMinutes: 5,
      confidenceLevel: "très élevé", // valeur inconnue dans l'enum
      factors: [],
      recommendation: "Test",
    });

    vi.mocked(anthropic.messages.create).mockResolvedValueOnce({
      id: "msg_test_004",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-8",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      content: [{ type: "text", text: jsonInvalide }],
    } as Awaited<ReturnType<typeof anthropic.messages.create>>);

    await expect(analyzeDelay(HISTORIQUE_AVEC_VOYAGES)).rejects.toThrow(
      "schéma"
    );
  });
});
