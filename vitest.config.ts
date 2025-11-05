import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    globalSetup: ["./__tests__/globalSetup.ts"],
    setupFiles: ["./__tests__/setup.ts"],
    env: {
      NODE_ENV: "test", // テストDBに自動切り替え
    },
    fileParallelism: false, // Integration Testsを直列実行（DB競合回避）
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "*.config.ts",
        ".next/",
        "drizzle/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
