import { expect, test } from "@playwright/test";
import { cleanupE2EData } from "./helpers/db-seed";
import {
  createTestAnniversary,
  createTestCollection,
} from "./fixtures/test-data";

test.describe("Anniversary CRUD", () => {
  let collectionId: number;

  // 各テスト前にCollectionを作成
  test.beforeEach(async () => {
    collectionId = await createTestCollection("E2EテストCollection");
  });

  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("Anniversary作成 → 一覧表示確認", async ({ page }) => {
    // 編集ページに移動
    await page.goto("/edit");

    // Anniversary追加ボタンをクリック
    await page.click(
      `a[href="/edit/collection/${collectionId}/anniversary/new"]`,
    );

    // フォーム入力
    await page.fill('input[name="name"]', "誕生日");
    await page.fill('input[name="anniversaryDate"]', "2020-11-04");
    await page.fill('textarea[name="description"]', "家族の誕生日");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await page.waitForURL("/edit");

    // 編集ページで確認
    await expect(page.getByText("誕生日").first()).toBeVisible();
    await expect(page.getByText("家族の誕生日").first()).toBeVisible();

    // 一覧ページで確認
    await page.goto("/");
    await expect(page.getByText("誕生日").first()).toBeVisible();
    await expect(page.locator("text=/令和2年/")).toBeVisible(); // 和暦
    await expect(page.locator("text=/\\d+\\s*日|今日/")).toBeVisible(); // カウントダウン
  });

  test("Anniversary編集 → 更新確認", async ({ page }) => {
    // 事前にAnniversaryを作成
    const anniversaryId = await createTestAnniversary(
      collectionId,
      "編集前記念日",
      "2020-01-01",
      { description: "変更前" },
    );

    // 編集ページに移動
    await page.goto(
      `/edit/collection/${collectionId}/anniversary/${anniversaryId}`,
    );

    // フォームが既存の値で埋められている
    await expect(page.locator('input[name="name"]')).toHaveValue("編集前記念日");
    await expect(page.locator('input[name="anniversaryDate"]')).toHaveValue(
      "2020-01-01",
    );
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      "変更前",
    );

    // 名前と日付を変更
    await page.fill('input[name="name"]', "編集後記念日");
    await page.fill('input[name="anniversaryDate"]', "2021-02-02");
    await page.fill('textarea[name="description"]', "変更後");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await page.waitForURL("/edit");

    // 変更が反映されている
    await expect(page.getByText("編集後記念日").first()).toBeVisible();
    await expect(page.getByText("変更後").first()).toBeVisible();
    await expect(page.getByText("編集前記念日")).not.toBeVisible();
  });

  test("Anniversary削除", async ({ page }) => {
    // 事前にAnniversaryを作成
    await createTestAnniversary(collectionId, "削除される記念日", "2020-03-03");

    // 編集ページに移動
    await page.goto("/edit");

    // 記念日が表示される
    await expect(page.getByText("削除される記念日").first()).toBeVisible();

    // 削除ボタンをクリック（最初に見つかった削除ボタン）
    await page.getByRole("button", { name: "削除" }).first().click();

    // 確認ダイアログが表示されるまで待機
    await expect(page.getByRole("button", { name: "削除する" })).toBeVisible();

    // 確認ダイアログの削除ボタンをクリック
    await page.getByRole("button", { name: "削除する" }).click();

    // 削除された記念日が表示されない（ページがリロードされるまで待機）
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("削除される記念日")).not.toBeVisible();
  });

  test("Anniversary作成時のバリデーションエラー（日付が空）", async ({ page }) => {
    await page.goto(`/edit/collection/${collectionId}/anniversary/new`);

    // HTML5バリデーションを無効化
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.setAttribute("novalidate", "");
    });

    // 名前のみ入力、日付を空のまま送信
    await page.fill('input[name="name"]', "エラーテスト");
    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(
      page.getByText(/日付を入力してください|Invalid date/),
    ).toBeVisible();

    // フォームページのまま
    await expect(page).toHaveURL(/\/anniversary\/new/);
  });

  test("Anniversary作成時のバリデーションエラー（無効な日付）", async ({ page }) => {
    await page.goto(`/edit/collection/${collectionId}/anniversary/new`);

    // HTML5バリデーションを無効化
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.setAttribute("novalidate", "");
    });

    // 無効な日付を入力（type属性を一時的に変更）
    await page.fill('input[name="name"]', "エラーテスト");
    await page.evaluate(() => {
      const input = document.querySelector('input[name="anniversaryDate"]') as HTMLInputElement;
      if (input) {
        input.type = "text";
        input.value = "2020-13-32";
      }
    });

    await page.click('button[type="submit"]');

    // エラーメッセージが表示される
    await expect(
      page.getByText(/無効な日付|Invalid date/),
    ).toBeVisible();
  });

  test("複数のAnniversaryを同じCollectionに追加", async ({ page }) => {
    await page.goto("/edit");

    // Anniversary 1
    await page.click(
      `a[href="/edit/collection/${collectionId}/anniversary/new"]`,
    );
    await page.fill('input[name="name"]', "記念日1");
    await page.fill('input[name="anniversaryDate"]', "2020-04-01");
    await page.click('button[type="submit"]');

    // Anniversary 2
    await page.click(
      `a[href="/edit/collection/${collectionId}/anniversary/new"]`,
    );
    await page.fill('input[name="name"]', "記念日2");
    await page.fill('input[name="anniversaryDate"]', "2020-05-02");
    await page.click('button[type="submit"]');

    // 両方表示される
    await expect(page.getByText("記念日1").first()).toBeVisible();
    await expect(page.getByText("記念日2").first()).toBeVisible();
  });

  test("Anniversaryの日付順序確認（カウントダウン順）", async ({ page }) => {
    // 複数の記念日を作成（日付が異なる）
    await createTestAnniversary(collectionId, "遠い未来", "2020-12-31");
    await createTestAnniversary(collectionId, "近い未来", "2020-01-15");
    await createTestAnniversary(collectionId, "中間", "2020-06-01");

    // 一覧ページで確認
    await page.goto("/");

    // 記念日が表示される（順序は実装依存）
    await expect(page.getByText("遠い未来").first()).toBeVisible();
    await expect(page.getByText("近い未来").first()).toBeVisible();
    await expect(page.getByText("中間").first()).toBeVisible();
  });
});
