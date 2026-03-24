import { defineConfig } from "vitest/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __vitest_dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    root: __vitest_dirname,
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/app/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      "@office-jam/shared": resolve(__vitest_dirname, "../../libs/shared/src"),
      "@office-jam/db": resolve(__vitest_dirname, "../../libs/db/src"),
    },
  },
});
