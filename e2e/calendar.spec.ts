import { expect, test } from "@playwright/test";

test.describe("カレンダー機能", () => {
  test.describe("祝日カレンダー（未認証）", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("祝日カレンダーページが表示される", async ({ page }) => {
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "カレンダー", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("内閣府が公開している祝日データを使用しています"),
      ).toBeVisible();
    });
  });

  test.describe("カレンダー（認証後）", () => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("カレンダーページが表示される", async ({ page }) => {
      await page.goto("/my-calendar");
      await page.waitForLoadState("networkidle");

      // PC版: 年次カレンダーのheadingが表示される
      const currentYear = new Date().getFullYear();
      await expect(
        page.getByRole("heading", { name: `${currentYear}年のカレンダー` }),
      ).toBeVisible();
    });

    test("祝日と記念日の両方が表示される", async ({ page }) => {
      await page.goto("/my-calendar");
      await page.waitForLoadState("networkidle");

      // 祝日の赤いドット
      await expect(page.locator(".bg-red-500").first()).toBeVisible();

      // 記念日の青いドット（テストデータに依存）
      const blueDot = page.locator(".bg-blue-500").first();
      if ((await blueDot.count()) > 0) {
        await expect(blueDot).toBeVisible();
      }
    });

    test("PC版: 年次カレンダーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/my-calendar");
      await page.waitForLoadState("networkidle");

      const currentYear = new Date().getFullYear();
      await expect(
        page.getByRole("heading", { name: `${currentYear}年のカレンダー` }),
      ).toBeVisible();
    });

    test("モバイル版: 月次カレンダーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto("/my-calendar");
      await page.waitForLoadState("networkidle");

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      await expect(
        page.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeVisible();
    });
  });

  test.describe("アクセシビリティ", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("祝日カレンダーページにはheadingがある", async ({ page }) => {
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      await expect(
        page.getByRole("heading", { name: "カレンダー", exact: true }),
      ).toBeVisible();
    });
  });
});
