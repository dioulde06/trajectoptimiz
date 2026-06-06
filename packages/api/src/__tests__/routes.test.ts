import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { appRouter, createCallerFactory } from "../index";

/* CUIDs de test — format valide : c[a-z0-9]{24} */
const USER_ID = "cjld2cjxh0000qzrmn831i7rn";
const ROUTE_ID = "ckh3abcd1234efgh5678ijklm";

/* Mock minimal du PrismaClient — as unknown évite any tout en typant correctement */
function buildMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
    },
    route: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient;
}

const createCaller = createCallerFactory(appRouter);

describe("routes.getAll", () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = buildMockPrisma();
  });

  it("retourne la liste des trajets d'un utilisateur", async () => {
    const trajets = [
      {
        id: ROUTE_ID,
        name: "Trajet matin",
        fromStop: "Dudweiler Markt",
        toStop: "Saarbrücken Hauptbahnhof",
        userId: USER_ID,
        createdAt: new Date("2024-09-01"),
        _count: { tripHistories: 5 },
      },
    ];

    vi.mocked(mockPrisma.route.findMany).mockResolvedValueOnce(trajets);

    const caller = createCaller({ prisma: mockPrisma, userId: null });
    const result = await caller.routes.getAll({ userId: USER_ID });

    expect(result).toEqual(trajets);
    expect(vi.mocked(mockPrisma.route.findMany)).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { tripHistories: true } } },
    });
  });

  it("retourne un tableau vide si l'utilisateur n'a pas de trajets", async () => {
    vi.mocked(mockPrisma.route.findMany).mockResolvedValueOnce([]);

    const caller = createCaller({ prisma: mockPrisma, userId: null });
    const result = await caller.routes.getAll({ userId: USER_ID });

    expect(result).toEqual([]);
  });
});

describe("routes.create", () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = buildMockPrisma();
  });

  const INPUT_VALIDE = {
    name: "Trajet domicile-travail",
    fromStop: "Dudweiler Markt",
    toStop: "Saarbrücken Hauptbahnhof",
    userId: USER_ID,
  };

  it("crée un trajet quand l'utilisateur existe et aucun doublon", async () => {
    const nouveauTrajet = {
      id: ROUTE_ID,
      ...INPUT_VALIDE,
      createdAt: new Date("2024-09-01"),
    };

    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce({ id: USER_ID });
    vi.mocked(mockPrisma.route.findFirst).mockResolvedValueOnce(null);
    vi.mocked(mockPrisma.route.create).mockResolvedValueOnce(nouveauTrajet);

    const caller = createCaller({ prisma: mockPrisma, userId: null });
    const result = await caller.routes.create(INPUT_VALIDE);

    expect(result).toEqual(nouveauTrajet);
    expect(vi.mocked(mockPrisma.route.create)).toHaveBeenCalledWith({
      data: {
        name: INPUT_VALIDE.name,
        fromStop: INPUT_VALIDE.fromStop,
        toStop: INPUT_VALIDE.toStop,
        userId: INPUT_VALIDE.userId,
      },
    });
  });

  it("lève NOT_FOUND si l'utilisateur n'existe pas", async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null);

    const caller = createCaller({ prisma: mockPrisma, userId: null });

    await expect(caller.routes.create(INPUT_VALIDE)).rejects.toThrow(TRPCError);
    await expect(caller.routes.create(INPUT_VALIDE)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("lève CONFLICT si un trajet identique existe déjà", async () => {
    vi.mocked(mockPrisma.user.findUnique).mockResolvedValue({ id: USER_ID });
    vi.mocked(mockPrisma.route.findFirst).mockResolvedValue({ id: ROUTE_ID });

    const caller = createCaller({ prisma: mockPrisma, userId: null });

    await expect(caller.routes.create(INPUT_VALIDE)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejette en amont un userId invalide (validation Zod)", async () => {
    const caller = createCaller({ prisma: mockPrisma, userId: null });

    await expect(
      caller.routes.create({ ...INPUT_VALIDE, userId: "pas-un-cuid" })
    ).rejects.toThrow();

    // Prisma ne doit jamais être appelé si la validation échoue
    expect(vi.mocked(mockPrisma.user.findUnique)).not.toHaveBeenCalled();
  });
});

describe("routes.delete", () => {
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = buildMockPrisma();
  });

  it("supprime un trajet existant et retourne son id", async () => {
    vi.mocked(mockPrisma.route.findUnique).mockResolvedValueOnce({
      id: ROUTE_ID,
      name: "Trajet matin",
    });
    vi.mocked(mockPrisma.route.delete).mockResolvedValueOnce({
      id: ROUTE_ID,
      name: "Trajet matin",
      fromStop: "Dudweiler Markt",
      toStop: "Saarbrücken Hauptbahnhof",
      userId: USER_ID,
      createdAt: new Date(),
    });

    const caller = createCaller({ prisma: mockPrisma, userId: null });
    const result = await caller.routes.delete({ id: ROUTE_ID });

    expect(result).toEqual({ id: ROUTE_ID });
    expect(vi.mocked(mockPrisma.route.delete)).toHaveBeenCalledWith({
      where: { id: ROUTE_ID },
    });
  });

  it("lève NOT_FOUND si le trajet n'existe pas", async () => {
    vi.mocked(mockPrisma.route.findUnique).mockResolvedValueOnce(null);

    const caller = createCaller({ prisma: mockPrisma, userId: null });

    await expect(
      caller.routes.delete({ id: ROUTE_ID })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(vi.mocked(mockPrisma.route.delete)).not.toHaveBeenCalled();
  });

  it("rejette un id qui n'est pas un CUID (validation Zod)", async () => {
    const caller = createCaller({ prisma: mockPrisma, userId: null });

    await expect(
      caller.routes.delete({ id: "pas-un-cuid" })
    ).rejects.toThrow();

    expect(vi.mocked(mockPrisma.route.findUnique)).not.toHaveBeenCalled();
  });
});
