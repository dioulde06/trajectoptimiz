import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /* Évite l'échec si aucun fichier de test n'est présent dans ce package */
    passWithNoTests: true,
  },
});
