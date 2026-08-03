import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Only pure, dependency-free modules are unit tested today (see
    // src/lib/bible-reference.test.ts). Anything touching Google APIs, Prisma
    // or React is verified end-to-end instead.
    include: ["src/**/*.test.ts"],
  },
});
