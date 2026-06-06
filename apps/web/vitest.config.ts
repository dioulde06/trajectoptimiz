import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /* Les tests web sont gérés par Playwright (E2E) — pas de tests unitaires ici */
    passWithNoTests: true,
  },
});
