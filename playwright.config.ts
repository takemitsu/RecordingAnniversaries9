import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // E2Eテストは順次実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // シーケンシャル実行
  reporter: "list", // 全テスト通過までHTMLレポート無効化
  globalSetup: require.resolve("./e2e/helpers/global-setup.ts"),
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    // Setup: 認証を1回だけ実行
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Tests: 認証済み状態を再利用
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "E2E_TEST=true npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false, // 常に新規起動してauth.tsの変更を確実に反映
    env: {
      E2E_TEST: "true",
      AUTH_URL: "http://localhost:3000", // Auth.jsセッション検証に必須
    },
  },
});
