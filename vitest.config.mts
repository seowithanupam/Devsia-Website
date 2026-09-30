import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
      // Lets tests import server-only modules (the database repositories). Used by the opt-in tests in tests/db.
      "server-only": fileURLToPath(new URL("./tests/db/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Process CSS Modules with readable class names so tests can assert on them.
    css: {
      include: /.+\.module\.css$/,
      modules: { classNameStrategy: "non-scoped" },
    },
  },
});
