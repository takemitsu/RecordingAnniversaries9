import { expect, test } from "@playwright/test";
import { cleanupE2EData } from "./helpers/db-seed";
import { createTestAnniversary, createTestCollection } from "./fixtures/test-data";

test.describe("Dashboard（一覧ページ）", () => {
  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("記念日が正しく表示される", async ({ page }) => {
    // テストデータ作成
    const collectionId = await createTestCollection("家族");
    await createTestAnniversary(collectionId, "誕生日", "2020-11-04", {
      description: "家族の誕生日",
    });

    // ダッシュボードにアクセス
    await page.goto("/");

    // Collectionが表示される
    await expect(page.getByText("家族").first()).toBeVisible();

    // Anniversaryが表示される
    await expect(page.getByText("誕生日").first()).toBeVisible();

    // 和暦が表示される（令和2年）
    await expect(page.locator("text=/令和2年/")).toBeVisible();

    // カウントダウンが表示される（「X日」または「今日」）
    await expect(page.locator("text=/\\d+\\s*日|今日/")).toBeVisible();
  });

  test("is_visible=0のCollectionは非表示", async ({ page }) => {
    // 表示Collectionと非表示Collectionを作成
    const visibleId = await createTestCollection("表示Collection");
    await createTestAnniversary(visibleId, "表示記念日", "2020-01-01");

    const hiddenId = await createTestCollection("非表示Collection", {
      isVisible: 0,
    });
    await createTestAnniversary(hiddenId, "非表示記念日", "2020-02-02");

    // ダッシュボードにアクセス
    await page.goto("/");

    // 表示Collectionは表示される
    await expect(page.getByText("表示Collection").first()).toBeVisible();
    await expect(page.getByText("表示記念日").first()).toBeVisible();

    // 非表示Collectionは表示されない
    await expect(page.getByText("非表示Collection")).not.toBeVisible();
    await expect(page.getByText("非表示記念日")).not.toBeVisible();
  });

  test("記念日がないCollectionは表示されない", async ({ page }) => {
    // 記念日なしのCollection作成
    await createTestCollection("空Collection");

    // 記念日ありのCollection作成
    const collectionId = await createTestCollection("記念日あり");
    await createTestAnniversary(collectionId, "テスト記念日", "2020-03-03");

    // ダッシュボードにアクセス
    await page.goto("/");

    // 記念日ありのCollectionは表示される
    await expect(page.getByText("記念日あり").first()).toBeVisible();
    await expect(page.getByText("テスト記念日").first()).toBeVisible();

    // 記念日なしのCollectionは表示されない
    await expect(page.getByText("空Collection")).not.toBeVisible();
  });

  test("複数のCollectionとAnniversaryが表示される", async ({ page }) => {
    // 複数のCollection + Anniversary作成
    const collection1 = await createTestCollection("家族");
    await createTestAnniversary(collection1, "父の誕生日", "2020-05-15");
    await createTestAnniversary(collection1, "母の誕生日", "2020-08-20");

    const collection2 = await createTestCollection("友人");
    await createTestAnniversary(collection2, "友人A", "2020-12-25");

    // ダッシュボードにアクセス
    await page.goto("/");

    // 全てのCollectionが表示される
    await expect(page.getByText("家族").first()).toBeVisible();
    await expect(page.getByText("友人").first()).toBeVisible();

    // 全てのAnniversaryが表示される
    await expect(page.getByText("父の誕生日").first()).toBeVisible();
    await expect(page.getByText("母の誕生日").first()).toBeVisible();
    await expect(page.getByText("友人A").first()).toBeVisible();
  });

  test("一覧ページでは編集ボタンが表示されない", async ({ page }) => {
    // テストデータ作成
    const collectionId = await createTestCollection("テスト");
    await createTestAnniversary(collectionId, "記念日", "2020-06-01");

    // ダッシュボードにアクセス
    await page.goto("/");

    // 編集ボタン・削除ボタンが存在しないことを確認
    await expect(page.getByRole("button", { name: /編集/i })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /削除/i })).not.toBeVisible();
    // ヘッダーの"編集"リンクは除外（カード内の編集リンクのみチェック）
    const editLinksInCards = page.locator('.border-t a[href*="/edit/collection/"]');
    await expect(editLinksInCards).toHaveCount(0);
  });
});
