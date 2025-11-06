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

  test("フォーム入力とラベル関連付け確認", async ({ page }) => {
    // Collection作成フォームに直接移動
    await page.goto("/edit/collection/new");

    // フォームフィールドが適切なラベルを持つことを確認
    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toBeVisible();
    await expect(nameLabel).toContainText("グループ名");

    const descriptionLabel = page.locator('label[for="description"]');
    await expect(descriptionLabel).toBeVisible();
    await expect(descriptionLabel).toContainText("説明");

    const isVisibleLabel = page.locator('label[for="isVisible"]');
    await expect(isVisibleLabel).toBeVisible();
    await expect(isVisibleLabel).toContainText("表示設定");

    // フォームフィールドに入力可能であることを確認
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill("アクセシビリティテスト");
    await expect(nameInput).toHaveValue("アクセシビリティテスト");

    const descriptionTextarea = page.locator('textarea[name="description"]');
    await descriptionTextarea.fill("フォーム入力テスト");
    await expect(descriptionTextarea).toHaveValue("フォーム入力テスト");

    // selectフィールドのデフォルト値確認
    const isVisibleSelect = page.locator('select[name="isVisible"]');
    await expect(isVisibleSelect).toHaveValue("1");

    // 送信ボタンが存在することを確認
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
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
