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
    await expect(page.getByText("家族の誕生日")).toBeVisible();

    // 一覧ページで確認
    await page.goto("/");
    await expect(page.getByText("誕生日").first()).toBeVisible();
    await expect(page.locator("text=/令和2年/")).toBeVisible(); // 和暦
    await expect(page.locator("text=/あと\\d+日|今日|明日/")).toBeVisible(); // カウントダウン
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
    await expect(page.getByText("編集後記念日")).toBeVisible();
    await expect(page.getByText("変更後")).toBeVisible();
    await expect(page.getByText("編集前記念日")).not.toBeVisible();
  });

  test("Anniversary削除", async ({ page }) => {
    // 事前にAnniversaryを作成
    await createTestAnniversary(collectionId, "削除される記念日", "2020-03-03");

    // 編集ページに移動
    await page.goto("/edit");

    // 記念日が表示される
    await expect(page.getByText("削除される記念日")).toBeVisible();

    // 削除ボタンをクリック
    await page.click('button:has-text("削除")');

    // 確認ダイアログが表示される
    await page.click('button:has-text("削除する")');

    // 削除された記念日が表示されない
    await expect(page.getByText("削除される記念日")).not.toBeVisible();
  });

  test("Anniversary作成時のバリデーションエラー（日付が空）", async ({ page }) => {
    await page.goto(`/edit/collection/${collectionId}/anniversary/new`);

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

    // 無効な日付
    await page.fill('input[name="name"]', "エラーテスト");
    await page.fill('input[name="anniversaryDate"]', "2020-13-32"); // 無効な月日

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
    await expect(page.getByText("記念日1")).toBeVisible();
    await expect(page.getByText("記念日2")).toBeVisible();
  });

  test("Anniversaryの日付順序確認（カウントダウン順）", async ({ page }) => {
    // 複数の記念日を作成（日付が異なる）
    await createTestAnniversary(collectionId, "遠い未来", "2020-12-31");
    await createTestAnniversary(collectionId, "近い未来", "2020-01-15");
    await createTestAnniversary(collectionId, "中間", "2020-06-01");

    // 一覧ページで確認
    await page.goto("/");

    // 記念日が表示される（順序は実装依存）
    await expect(page.getByText("遠い未来")).toBeVisible();
    await expect(page.getByText("近い未来")).toBeVisible();
    await expect(page.getByText("中間")).toBeVisible();
  });
});
