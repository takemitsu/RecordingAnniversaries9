import { expect, test } from "@playwright/test";
import { cleanupE2EData } from "./helpers/db-seed";
import { createTestCollection } from "./fixtures/test-data";

test.describe("Collection CRUD", () => {
  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("Collection作成 → 編集 → 削除のフルフロー", async ({ page }) => {
    // 編集ページに移動
    await page.goto("/edit");

    // === 作成 ===
    await page.click('a[href="/edit/collection/new"]');

    // フォーム入力
    await page.fill('input[name="name"]', "テストCollection");
    await page.fill('textarea[name="description"]', "説明文テスト");

    // 表示/非表示ラジオボタン（デフォルトは表示=1）
    await expect(page.locator('input[name="isVisible"][value="1"]')).toBeChecked();

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await page.waitForURL("/edit");

    // 作成したCollectionが表示される
    await expect(page.getByText("テストCollection").first()).toBeVisible();
    await expect(page.getByText("説明文テスト").first()).toBeVisible();

    // === 編集 ===
    // 編集ボタンをクリック
    await page.click('a[href*="/edit/collection/"]:has-text("編集")');

    // フォームが既存の値で埋められている
    await expect(page.locator('input[name="name"]')).toHaveValue(
      "テストCollection",
    );
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      "説明文テスト",
    );

    // 名前を変更
    await page.fill('input[name="name"]', "更新Collection");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await page.waitForURL("/edit");

    // 更新されたCollectionが表示される
    await expect(page.getByText("更新Collection")).toBeVisible();
    await expect(page.getByText("テストCollection")).not.toBeVisible();

    // === 削除 ===
    // 削除ボタンをクリック
    await page.click('button:has-text("削除")');

    // 確認ダイアログが表示される（確認ボタンをクリック）
    await page.click('button:has-text("削除する")');

    // 削除されたCollectionが表示されない
    await expect(page.getByText("更新Collection")).not.toBeVisible();
  });

  test("Collection作成時のバリデーションエラー", async ({ page }) => {
    await page.goto("/edit/collection/new");

    // HTML5バリデーションを無効化
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.setAttribute("novalidate", "");
    });

    // 名前を空のまま送信
    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(
      page.getByText(/名前を入力してください|String must contain at least 1/),
    ).toBeVisible();

    // 編集ページにリダイレクトされない（フォームページのまま）
    await expect(page).toHaveURL(/\/edit\/collection\/new/);
  });

  test("Collection編集で名前を変更", async ({ page }) => {
    // 事前にCollectionを作成
    const collectionId = await createTestCollection("編集前Collection", {
      description: "変更前の説明",
    });

    // 編集ページに移動
    await page.goto(`/edit/collection/${collectionId}`);

    // 名前と説明を変更
    await page.fill('input[name="name"]', "編集後Collection");
    await page.fill('textarea[name="description"]', "変更後の説明");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await page.waitForURL("/edit");

    // 変更が反映されている
    await expect(page.getByText("編集後Collection").first()).toBeVisible();
    await expect(page.getByText("変更後の説明").first()).toBeVisible();
    await expect(page.getByText("編集前Collection")).not.toBeVisible();
  });

  test("Collection削除時にAnniversariesも削除される（CASCADE）", async ({ page }) => {
    // Collection + Anniversary作成
    const collectionId = await createTestCollection("削除テスト");

    // Anniversaryを追加（UI経由）
    await page.goto(`/edit/collection/${collectionId}/anniversary/new`);
    await page.fill('input[name="name"]', "削除される記念日");
    await page.fill('input[name="anniversaryDate"]', "2020-01-01");
    await page.click('button[type="submit"]');

    // 編集ページで確認
    await page.goto("/edit");
    await expect(page.getByText("削除テスト").first()).toBeVisible();
    await expect(page.getByText("削除される記念日").first()).toBeVisible();

    // Collection削除
    await page.getByRole("button", { name: "削除" }).first().click();

    // 確認ダイアログが表示されるまで待機
    await expect(page.getByRole("button", { name: "削除する" })).toBeVisible();

    // 確認ダイアログの削除ボタンをクリック
    await page.getByRole("button", { name: "削除する" }).click();

    // Collection + Anniversaryが両方削除される（ページがリロードされるまで待機）
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("削除テスト")).not.toBeVisible();
    await expect(page.getByText("削除される記念日")).not.toBeVisible();
  });

  test("is_visible=0で作成したCollectionは一覧ページに表示されない", async ({ page }) => {
    await page.goto("/edit/collection/new");

    // 非表示Collection作成
    await page.fill('input[name="name"]', "非表示Collection");
    await page.click('input[name="isVisible"][value="0"]');
    await page.click('button[type="submit"]');

    // 編集ページでは表示される
    await page.goto("/edit");
    await expect(page.getByText("非表示Collection")).toBeVisible();

    // 一覧ページでは表示されない
    await page.goto("/");
    await expect(page.getByText("非表示Collection")).not.toBeVisible();
  });

  test("複数のCollectionを作成できる", async ({ page }) => {
    await page.goto("/edit");

    // Collection 1作成
    await page.click('a[href="/edit/collection/new"]');
    await page.fill('input[name="name"]', "家族");
    await page.click('button[type="submit"]');

    // Collection 2作成
    await page.click('a[href="/edit/collection/new"]');
    await page.fill('input[name="name"]', "友人");
    await page.click('button[type="submit"]');

    // 両方表示される
    await expect(page.getByText("家族")).toBeVisible();
    await expect(page.getByText("友人")).toBeVisible();
  });
});
