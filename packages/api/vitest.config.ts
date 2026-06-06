import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      ANTHROPIC_API_KEY: "sk-ant-test-placeholder-for-unit-tests",
      NODE_ENV: "test",
    },
  },
});
