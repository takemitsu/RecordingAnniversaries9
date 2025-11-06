import { expect, test } from "@playwright/test";
import {
  createTestAnniversary,
  createTestCollection,
} from "./fixtures/test-data";
import { cleanupE2EData } from "./helpers/db-seed";

test.describe("Accessibility（アクセシビリティ）", () => {
  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("キーボードナビゲーション（フォーム操作）", async ({ page }) => {
    // Collection作成フォームに直接移動
    await page.goto("/edit/collection/new");

    // フォームフィールドがキーボード操作可能であることを確認
    const nameInput = page.locator('input[name="name"]');
    const descriptionTextarea = page.locator('textarea[name="description"]');
    const isVisibleSelect = page.locator('select[name="isVisible"]');
    const submitButton = page.locator('button[type="submit"]');

    // nameフィールドにフォーカスしてキーボード入力
    await nameInput.focus();
    await page.keyboard.type("キーボードテスト");
    await expect(nameInput).toHaveValue("キーボードテスト");

    // Tabキーで次のフィールド（description）に移動
    await page.keyboard.press("Tab");
    await expect(descriptionTextarea).toBeFocused();
    await page.keyboard.type("キーボードで入力した説明");
    await expect(descriptionTextarea).toHaveValue("キーボードで入力した説明");

    // Tabキーでselectフィールドに移動
    await page.keyboard.press("Tab");
    await expect(isVisibleSelect).toBeFocused();
    await expect(isVisibleSelect).toHaveValue("1"); // デフォルト値

    // Tabキーで送信ボタンに移動
    await page.keyboard.press("Tab"); // ボタンへ
    await expect(submitButton).toBeFocused();

    // すべてのフォーム要素がキーボードでアクセス可能であることが確認できた
  });

  test("ログアウト→再ログイン→データ永続性", async ({ page, context }) => {
    // テストデータ作成（ログイン状態で）
    const collectionId = await createTestCollection("永続性テスト");
    await createTestAnniversary(collectionId, "テスト記念日", "2020-06-15", {
      description: "ログアウト前のデータ",
    });

    // データが表示されることを確認
    await page.goto("/");
    await expect(page.getByText("永続性テスト").first()).toBeVisible();
    await expect(page.getByText("テスト記念日").first()).toBeVisible();

    // ログアウト（セッションクッキー削除）
    await context.clearCookies();

    // ログイン画面にリダイレクトされる（認証が必要なページにアクセス）
    await page.goto("/edit");
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/signin/);

    // 再ログイン（Storage Stateを再読み込み）
    const fs = await import("node:fs");
    const storageState = JSON.parse(
      fs.readFileSync("e2e/.auth/user.json", "utf-8"),
    );
    await context.addCookies(storageState.cookies);

    // データが保持されていることを確認
    await page.goto("/");
    await expect(page.getByText("永続性テスト").first()).toBeVisible();
    await expect(page.getByText("テスト記念日").first()).toBeVisible();
    await expect(page.getByText("ログアウト前のデータ").first()).toBeVisible();
  });
});
