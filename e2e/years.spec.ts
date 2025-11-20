import { expect, test } from "@playwright/test";
import { cleanupE2EData } from "./helpers/db-seed";

test.describe("年度一覧ページ", () => {
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  test("未ログイン時でも年度一覧ページにアクセスできる", async ({
    browser,
  }) => {
    // 未ログインの新しいコンテキストを作成
    const context = await browser.newContext();
    const page = await context.newPage();

    // 未ログイン状態で年度一覧ページにアクセス
    await page.goto("/years");

    // ページタイトルが表示される
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();

    // 説明文が表示される
    await expect(page.getByText(/今日は/)).toBeVisible();
    await expect(
      page.getByText(/年度は12\/31基準で元年が表示されるようにしています/),
    ).toBeVisible();

    // テーブルが表示される
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // テーブルヘッダーが表示される
    await expect(table.locator("th").filter({ hasText: "No." })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "年度" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "開始" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "終了" })).toBeVisible();

    await context.close();
  });

  test("テーブルに年度データが表示される", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/years");

    // 現在年度が表示される
    const currentYear = new Date().getFullYear();
    await expect(page.locator("text=/令和\\d+年度/").first()).toBeVisible();

    // 開始・終了月が表示される
    await expect(
      page.locator(`text=/${currentYear}年4月/`).first(),
    ).toBeVisible();
    await expect(
      page.locator(`text=/${currentYear + 1}年3月/`).first(),
    ).toBeVisible();

    // 平成の年度も表示される
    await expect(page.locator("text=/平成\\d+年度/").first()).toBeVisible();

    // 複数の行が表示される（最低でも10行以上）
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(currentYear - 1900 + 1); // 1900年から現在年まで

    await context.close();
  });

  test("ログイン画面から年度一覧リンクが表示される", async ({ browser }) => {
    // 未ログインの新しいコンテキストを作成（認証状態をクリア）
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    // ログイン画面にアクセス
    await page.goto("/auth/signin");

    // ログイン画面が表示されるまで待つ
    await expect(
      page.getByRole("heading", {
        name: "Recording Anniversaries",
        exact: true,
      }),
    ).toBeVisible();

    // 年度一覧リンクが表示される
    const yearsLink = page.getByRole("link", { name: "年度一覧を見る" });
    await expect(yearsLink).toBeVisible();

    // リンクをクリックして年度一覧ページに遷移
    await yearsLink.click();
    await expect(page).toHaveURL("/years");
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();

    await context.close();
  });

  test("ログイン済み時、メニューから年度一覧にアクセスできる（モバイル）", async ({
    page,
  }) => {
    // ダッシュボードにアクセス（ログイン状態）
    await page.goto("/");

    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // ハンバーガーメニューを開く
    const hamburgerButton = page.locator('button[type="button"]').filter({
      has: page.locator('svg path[d*="M4 6h16M4 12h16M4 18h16"]'),
    });
    await hamburgerButton.click();

    // 年度一覧リンクが表示される
    const yearsLink = page
      .locator('a[href="/years"]')
      .filter({ hasText: "年度一覧" });
    await expect(yearsLink).toBeVisible();

    // リンクをクリックして年度一覧ページに遷移
    await yearsLink.click();
    await expect(page).toHaveURL("/years");
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();
  });

  test("ログイン済み時、メニューから年度一覧にアクセスできる（デスクトップ）", async ({
    page,
  }) => {
    // ダッシュボードにアクセス（ログイン状態）
    await page.goto("/");

    // デスクトップビューポートに変更
    await page.setViewportSize({ width: 1280, height: 720 });

    // ユーザードロップダウンを開く
    const userButton = page.locator("button").filter({ hasText: /Test User/ });
    await userButton.click();

    // ドロップダウンメニュー内の年度一覧リンクをクリック
    // ドロップダウンメニューは絶対配置されているため、visible状態のリンクを探す
    const yearsLink = page
      .locator('a[href="/years"]')
      .filter({ hasText: "年度一覧" })
      .first();
    await yearsLink.click();

    await expect(page).toHaveURL("/years");
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();
  });

  test("年度一覧ページからヘッダーのリンクで他ページに遷移できる", async ({
    page,
  }) => {
    // 年度一覧ページにアクセス（ログイン状態）
    await page.goto("/years");

    // ヘッダーのロゴをクリックしてダッシュボードに遷移
    await page.getByRole("link", { name: "ra" }).click();
    await expect(page).toHaveURL("/");
  });

  test("レスポンシブデザインが正しく動作する", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/years");

    // モバイルビューポート
    await page.setViewportSize({ width: 360, height: 640 });
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // タブレットビューポート
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // デスクトップビューポート
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByRole("heading", { name: "年度一覧" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    await context.close();
  });

  test("テーブルが正しく並んでいる（降順）", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/years");

    // 最初の行（No.0）は現在年の年度
    const currentYear = new Date().getFullYear();
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow.locator("td").first()).toHaveText("0");

    // テーブルの行数を確認
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBe(currentYear - 1900 + 1);

    await context.close();
  });
});
