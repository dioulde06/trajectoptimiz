import { describe, it, expect } from "vitest";
import { validateServerEnv, validateClientEnv } from "../env";

const ENV_VALIDE = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/transitsaar",
  ANTHROPIC_API_KEY: "sk-ant-test-cle-12345678",
  NODE_ENV: "test",
} as const;

describe("validateServerEnv", () => {
  it("accepte des variables d'environnement valides", () => {
    const result = validateServerEnv(ENV_VALIDE);

    expect(result.DATABASE_URL).toBe(ENV_VALIDE.DATABASE_URL);
    expect(result.ANTHROPIC_API_KEY).toBe(ENV_VALIDE.ANTHROPIC_API_KEY);
    expect(result.NODE_ENV).toBe("test");
  });

  it("applique la valeur par défaut development si NODE_ENV absent", () => {
    const { NODE_ENV: _omis, ...sansSujet } = ENV_VALIDE;
    const result = validateServerEnv(sansSujet);

    expect(result.NODE_ENV).toBe("development");
  });

  it("lève une erreur si DATABASE_URL est absent", () => {
    const { DATABASE_URL: _omis, ...sansUrl } = ENV_VALIDE;

    expect(() => validateServerEnv(sansUrl)).toThrow(
      "Variables d'environnement invalides"
    );
  });

  it("lève une erreur si DATABASE_URL ne commence pas par postgresql://", () => {
    expect(() =>
      validateServerEnv({ ...ENV_VALIDE, DATABASE_URL: "mysql://localhost/db" })
    ).toThrow();
  });

  it("lève une erreur si DATABASE_URL n'est pas une URL valide", () => {
    expect(() =>
      validateServerEnv({ ...ENV_VALIDE, DATABASE_URL: "postgresql://pas-une-url" })
    ).not.toThrow();

    expect(() =>
      validateServerEnv({ ...ENV_VALIDE, DATABASE_URL: "pas-une-url" })
    ).toThrow();
  });

  it("lève une erreur si ANTHROPIC_API_KEY est absente", () => {
    const { ANTHROPIC_API_KEY: _omis, ...sansCle } = ENV_VALIDE;

    expect(() => validateServerEnv(sansCle)).toThrow();
  });

  it("lève une erreur si ANTHROPIC_API_KEY ne commence pas par sk-ant-", () => {
    expect(() =>
      validateServerEnv({ ...ENV_VALIDE, ANTHROPIC_API_KEY: "sk-openai-fausse-cle" })
    ).toThrow();
  });

  it("lève une erreur si NODE_ENV a une valeur inconnue", () => {
    expect(() =>
      validateServerEnv({ ...ENV_VALIDE, NODE_ENV: "staging" })
    ).toThrow();
  });

  it("accepte NODE_ENV=production", () => {
    const result = validateServerEnv({ ...ENV_VALIDE, NODE_ENV: "production" });

    expect(result.NODE_ENV).toBe("production");
  });
});

describe("validateClientEnv", () => {
  it("accepte une URL d'application valide", () => {
    const result = validateClientEnv({
      NEXT_PUBLIC_APP_URL: "https://transitsaar.vercel.app",
    });

    expect(result.NEXT_PUBLIC_APP_URL).toBe("https://transitsaar.vercel.app");
  });

  it("applique la valeur par défaut http://localhost:3000 si absent", () => {
    const result = validateClientEnv({});

    expect(result.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("lève une erreur si NEXT_PUBLIC_APP_URL n'est pas une URL valide", () => {
    expect(() =>
      validateClientEnv({ NEXT_PUBLIC_APP_URL: "pas-une-url" })
    ).toThrow("Variables d'environnement client invalides");
  });
});
