import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /* E2E tests are run separately by Playwright — exclude them from Vitest */
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    passWithNoTests: true,
  },
});
