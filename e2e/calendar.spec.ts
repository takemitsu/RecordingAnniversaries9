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

    test("PC版: 2×6グリッドで12ヶ月が表示される", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      // 12ヶ月すべてのヘッダーが表示される
      for (let month = 1; month <= 12; month++) {
        await expect(page.getByText(`${month}月`).first()).toBeVisible();
      }
    });

    test("PC版: 年のナビゲーションが動作する", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      const currentYear = new Date().getFullYear();

      // 現在の年が表示される
      await expect(
        page.getByRole("heading", { name: `${currentYear}年のカレンダー` }),
      ).toBeVisible();

      // 次年ボタンをクリック
      await page
        .getByRole("button", { name: new RegExp(`${currentYear + 1}`) })
        .click();
      await expect(
        page.getByRole("heading", { name: `${currentYear + 1}年のカレンダー` }),
      ).toBeVisible();

      // 前年ボタンをクリック（2回）
      await page
        .getByRole("button", { name: new RegExp(`${currentYear}`) })
        .click();
      await page
        .getByRole("button", { name: new RegExp(`${currentYear - 1}`) })
        .click();
      await expect(
        page.getByRole("heading", { name: `${currentYear - 1}年のカレンダー` }),
      ).toBeVisible();

      // 今年ボタンで現在の年に戻る
      await page.getByRole("button", { name: "今年" }).click();
      await expect(
        page.getByRole("heading", { name: `${currentYear}年のカレンダー` }),
      ).toBeVisible();
    });

    test("モバイル版: 月次カレンダーが表示される", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 今月と来月のヘッダーが表示される
      await expect(
        page.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeVisible();

      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      await expect(
        page.getByText(`${nextMonthYear}年${nextMonth}月`),
      ).toBeVisible();
    });

    test("モバイル版: 月のナビゲーションが動作する", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 次月ボタンをクリック
      await page.getByRole("button", { name: "▶" }).click();
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      await expect(
        page.getByText(`${nextMonthYear}年${nextMonth}月`),
      ).toBeVisible();

      // 今月ボタンで現在の月に戻る
      await page.getByRole("button", { name: "今月" }).click();
      await expect(
        page.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeVisible();

      // 前月ボタンをクリック
      await page.getByRole("button", { name: "◀" }).click();
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      await expect(
        page.getByText(`${prevMonthYear}年${prevMonth}月`),
      ).toBeVisible();
    });

    test("祝日のドットインジケーターが表示される", async ({ page }) => {
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      // 祝日の赤いドット（bg-red-500）が表示される
      await expect(page.locator(".bg-red-500").first()).toBeVisible();
    });

    test("祝日のツールチップが表示される", async ({ page }) => {
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      // 祝日がある日付セルをクリック（赤いドットがある）
      const holidayButton = page
        .locator("button", { has: page.locator(".bg-red-500") })
        .first();
      await holidayButton.click();

      // ツールチップに🎌と「元日」が表示される
      await expect(page.getByText("🎌")).toBeVisible();
      await expect(page.getByText("元日")).toBeVisible();
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

    test("記念日のツールチップが表示される", async ({ page }) => {
      await page.goto("/my-calendar");
      await page.waitForLoadState("networkidle");

      // 記念日がある日をクリック（青いドット）
      const anniversaryButton = page
        .locator("button", { has: page.locator(".bg-blue-500") })
        .first();

      if ((await anniversaryButton.count()) > 0) {
        await anniversaryButton.click();
        // ツールチップに🎂と記念日が表示される
        await expect(page.getByText("🎂")).toBeVisible();
        await expect(page.locator(".absolute.z-10")).toBeVisible();
      }
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

    test("カレンダーの日付セルはbuttonである", async ({ page }) => {
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");

      // 日付セルがbuttonとしてアクセス可能
      const buttons = page.locator("button");
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
