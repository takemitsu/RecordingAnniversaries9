import { test } from "@playwright/test";

test.describe("スクリーンショット確認", { tag: "@screenshot" }, () => {
  // デスクトップ版
  test.describe("デスクトップ", () => {
    // ライトモード
    test.describe("ライトモード", () => {
      test.use({ colorScheme: "light" });

      test.describe("未認証", () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test("サインインページ", async ({ page }) => {
          await page.goto("/auth/signin");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/signin.png",
            fullPage: true,
          });
        });
      });

      test.describe("認証後", () => {
        test.use({ storageState: "e2e/.auth/user.json" });

        test("トップページ（一覧）", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/top-page.png",
            fullPage: true,
          });
        });

        test("年度一覧ページ", async ({ page }) => {
          await page.goto("/years");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/years-page.png",
            fullPage: true,
          });
        });

        test("編集ページ", async ({ page }) => {
          await page.goto("/edit");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/edit-page.png",
            fullPage: true,
          });
        });

        test("プロフィール設定ページ", async ({ page }) => {
          await page.goto("/profile");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/profile-page.png",
            fullPage: true,
          });
        });

        test("Collection作成ページ", async ({ page }) => {
          await page.goto("/edit/collection/new");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/collection-new.png",
            fullPage: true,
          });
        });
      });
    });

    // ダークモード
    test.describe("ダークモード", () => {
      test.use({ colorScheme: "dark" });

      test.describe("未認証", () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test("サインインページ", async ({ page }) => {
          await page.goto("/auth/signin");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/signin.png",
            fullPage: true,
          });
        });
      });

      test.describe("認証後", () => {
        test.use({ storageState: "e2e/.auth/user.json" });

        test("トップページ（一覧）", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/top-page.png",
            fullPage: true,
          });
        });

        test("年度一覧ページ", async ({ page }) => {
          await page.goto("/years");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/years-page.png",
            fullPage: true,
          });
        });

        test("編集ページ", async ({ page }) => {
          await page.goto("/edit");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/edit-page.png",
            fullPage: true,
          });
        });

        test("プロフィール設定ページ", async ({ page }) => {
          await page.goto("/profile");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/profile-page.png",
            fullPage: true,
          });
        });

        test("Collection作成ページ", async ({ page }) => {
          await page.goto("/edit/collection/new");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/collection-new.png",
            fullPage: true,
          });
        });
      });
    });
  });

  // モバイル版 (iPhone SE: 360x640)
  test.describe("モバイル", () => {
    test.use({ viewport: { width: 360, height: 640 } });

    // ライトモード
    test.describe("ライトモード", () => {
      test.use({ colorScheme: "light" });

      test.describe("未認証", () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test("サインインページ", async ({ page }) => {
          await page.goto("/auth/signin");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/signin.png",
            fullPage: true,
          });
        });
      });

      test.describe("認証後", () => {
        test.use({ storageState: "e2e/.auth/user.json" });

        test("トップページ（一覧）", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/top-page.png",
            fullPage: true,
          });
        });

        test("年度一覧ページ", async ({ page }) => {
          await page.goto("/years");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/years-page.png",
            fullPage: true,
          });
        });

        test("編集ページ", async ({ page }) => {
          await page.goto("/edit");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/edit-page.png",
            fullPage: true,
          });
        });

        test("プロフィール設定ページ", async ({ page }) => {
          await page.goto("/profile");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/profile-page.png",
            fullPage: true,
          });
        });

        test("Collection作成ページ", async ({ page }) => {
          await page.goto("/edit/collection/new");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/light/mobile/collection-new.png",
            fullPage: true,
          });
        });
      });
    });

    // ダークモード
    test.describe("ダークモード", () => {
      test.use({ colorScheme: "dark" });

      test.describe("未認証", () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test("サインインページ", async ({ page }) => {
          await page.goto("/auth/signin");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/signin.png",
            fullPage: true,
          });
        });
      });

      test.describe("認証後", () => {
        test.use({ storageState: "e2e/.auth/user.json" });

        test("トップページ（一覧）", async ({ page }) => {
          await page.goto("/");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/top-page.png",
            fullPage: true,
          });
        });

        test("年度一覧ページ", async ({ page }) => {
          await page.goto("/years");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/years-page.png",
            fullPage: true,
          });
        });

        test("編集ページ", async ({ page }) => {
          await page.goto("/edit");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/edit-page.png",
            fullPage: true,
          });
        });

        test("プロフィール設定ページ", async ({ page }) => {
          await page.goto("/profile");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/profile-page.png",
            fullPage: true,
          });
        });

        test("Collection作成ページ", async ({ page }) => {
          await page.goto("/edit/collection/new");
          await page.waitForLoadState("networkidle");

          await page.screenshot({
            path: "e2e/screenshots/dark/mobile/collection-new.png",
            fullPage: true,
          });
        });
      });
    });
  });
});
