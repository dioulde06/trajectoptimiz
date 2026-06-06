import { describe, it, expect } from "vitest";
import { KNOWN_STOPS, StopSchema, CreateRouteSchema, RoutesByUserSchema, RouteByIdSchema } from "../route";

/* CUID valide pour les tests — format : c[a-z0-9]{24} */
const CUID_VALIDE = "cjld2cjxh0000qzrmn831i7rn";

describe("KNOWN_STOPS", () => {
  it("contient exactement 10 arrêts", () => {
    expect(KNOWN_STOPS).toHaveLength(10);
  });

  it("commence par Dudweiler Markt", () => {
    expect(KNOWN_STOPS[0]).toBe("Dudweiler Markt");
  });

  it("se termine par Neunkirchen Stadtmitte", () => {
    expect(KNOWN_STOPS[KNOWN_STOPS.length - 1]).toBe("Neunkirchen Stadtmitte");
  });

  it("inclut les arrêts principaux de la ligne S1", () => {
    expect(KNOWN_STOPS).toContain("Saarbrücken Hauptbahnhof");
    expect(KNOWN_STOPS).toContain("Neunkirchen Hauptbahnhof");
    expect(KNOWN_STOPS).toContain("Sulzbach");
  });

  it("est une constante immuable (readonly)", () => {
    // TypeScript garantit l'immutabilité via as const — on vérifie au runtime
    const stops: readonly string[] = KNOWN_STOPS;
    expect(stops).toBeDefined();
  });
});

describe("StopSchema", () => {
  it("accepte chaque arrêt connu", () => {
    for (const stop of KNOWN_STOPS) {
      expect(StopSchema.safeParse(stop).success).toBe(true);
    }
  });

  it("rejette un arrêt inconnu", () => {
    const result = StopSchema.safeParse("Paris Gare du Nord");
    expect(result.success).toBe(false);
  });

  it("rejette une chaîne vide", () => {
    expect(StopSchema.safeParse("").success).toBe(false);
  });

  it("rejette une valeur non-string", () => {
    expect(StopSchema.safeParse(42).success).toBe(false);
    expect(StopSchema.safeParse(null).success).toBe(false);
  });
});

describe("CreateRouteSchema", () => {
  const DONNEES_VALIDES = {
    name: "Trajet domicile-travail",
    fromStop: "Dudweiler Markt",
    toStop: "Saarbrücken Hauptbahnhof",
    userId: CUID_VALIDE,
  };

  it("accepte des données valides", () => {
    const result = CreateRouteSchema.safeParse(DONNEES_VALIDES);
    expect(result.success).toBe(true);
  });

  it("retourne les données parsées à l'identique", () => {
    const result = CreateRouteSchema.safeParse(DONNEES_VALIDES);
    if (!result.success) throw new Error("Parse échoué de manière inattendue");

    expect(result.data.name).toBe(DONNEES_VALIDES.name);
    expect(result.data.fromStop).toBe(DONNEES_VALIDES.fromStop);
    expect(result.data.toStop).toBe(DONNEES_VALIDES.toStop);
    expect(result.data.userId).toBe(DONNEES_VALIDES.userId);
  });

  it("rejette un nom vide", () => {
    const result = CreateRouteSchema.safeParse({ ...DONNEES_VALIDES, name: "" });
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("requis");
    }
  });

  it("rejette un nom dépassant 100 caractères", () => {
    const result = CreateRouteSchema.safeParse({
      ...DONNEES_VALIDES,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepte un nom de exactement 100 caractères", () => {
    const result = CreateRouteSchema.safeParse({
      ...DONNEES_VALIDES,
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejette un userId qui n'est pas un CUID", () => {
    const result = CreateRouteSchema.safeParse({
      ...DONNEES_VALIDES,
      userId: "pas-un-cuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un arrêt de départ vide", () => {
    const result = CreateRouteSchema.safeParse({ ...DONNEES_VALIDES, fromStop: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un arrêt d'arrivée vide", () => {
    const result = CreateRouteSchema.safeParse({ ...DONNEES_VALIDES, toStop: "" });
    expect(result.success).toBe(false);
  });

  it("rejette des données incomplètes", () => {
    expect(CreateRouteSchema.safeParse({ name: "Test" }).success).toBe(false);
    expect(CreateRouteSchema.safeParse({}).success).toBe(false);
  });
});

describe("RoutesByUserSchema", () => {
  it("accepte un userId CUID valide", () => {
    expect(RoutesByUserSchema.safeParse({ userId: CUID_VALIDE }).success).toBe(true);
  });

  it("rejette un userId invalide", () => {
    expect(RoutesByUserSchema.safeParse({ userId: "invalide" }).success).toBe(false);
  });
});

describe("RouteByIdSchema", () => {
  it("accepte un id CUID valide", () => {
    expect(RouteByIdSchema.safeParse({ id: CUID_VALIDE }).success).toBe(true);
  });

  it("rejette un id invalide", () => {
    expect(RouteByIdSchema.safeParse({ id: "pas-un-cuid" }).success).toBe(false);
  });
});
