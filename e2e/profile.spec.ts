import { expect, test } from "@playwright/test";
import { cleanupE2EData, getTestDb } from "./helpers/db-seed";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

test.describe("Profile（プロフィール設定）", () => {
  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("ユーザー名変更フロー", async ({ page }) => {
    // プロフィールページに移動
    await page.goto("/profile");

    // フォームが既存の値（E2E Test User）で埋められている
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "E2E Test User",
    );

    // ユーザー名を変更
    await page.fill('input[name="name"]', "変更後の名前");

    // 送信
    await page.click('button[type="submit"]');

    // プロフィールページにリダイレクト（または同ページ）
    await page.waitForURL("/profile");

    // 変更が反映されている
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "変更後の名前",
    );

    // DBでも確認
    const db = await getTestDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, "e2e-user-id"),
    });
    expect(user?.name).toBe("変更後の名前");
  });

  test("ユーザー名変更後、ヘッダーに反映される", async ({ page }) => {
    // プロフィールページで名前を変更
    await page.goto("/profile");
    await page.fill('input[name="name"]', "ヘッダー表示テスト");
    await page.click('button[type="submit"]');

    // トップページに移動
    await page.goto("/");

    // ヘッダーに新しい名前が表示される
    await expect(page.locator("body")).toContainText("ヘッダー表示テスト");
  });

  test("ユーザー名を空にすると、バリデーションエラー", async ({ page }) => {
    // 事前にユーザー名をリセット
    const db = await getTestDb();
    await db
      .update(schema.users)
      .set({ name: "E2E Test User" })
      .where(eq(schema.users.id, "e2e-user-id"));

    await page.goto("/profile");

    // HTML5バリデーションを無効化
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.setAttribute("novalidate", "");
    });

    // 名前を空にして送信
    await page.fill('input[name="name"]', "");
    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(
      page.getByText(/名前を入力してください|String must contain at least 1/),
    ).toBeVisible();

    // DBは変更されていない
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, "e2e-user-id"),
    });
    expect(user?.name).toBe("E2E Test User"); // 元のまま
  });
});
