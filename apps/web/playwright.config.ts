import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,

  /* Interdit les `.only` en CI pour éviter les tests partiels */
  forbidOnly: !!process.env["CI"],

  /* Relances automatiques en CI uniquement */
  retries: process.env["CI"] ? 2 : 0,

  /* Workers séquentiels en CI (1), parallèles en local (par défaut Playwright) */
  ...(process.env["CI"] ? { workers: 1 } : {}),

  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3000",
    /* Capture la trace sur le premier échec pour le débogage */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Démarre le serveur Next.js avant les tests */
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
    /* Variables d'environnement factices pour le démarrage du serveur.
       Les tests mockent les appels API — la DB n'est pas réellement contactée. */
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/transitsaar_test",
      ANTHROPIC_API_KEY: "sk-ant-test-key-e2e-placeholder",
      NODE_ENV: "test",
    },
  },
});
