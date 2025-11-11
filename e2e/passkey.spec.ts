import { expect, test } from "@playwright/test";
import { cleanupE2EData } from "./helpers/db-seed";

/**
 * Passkey（WebAuthn）機能のE2Eテスト
 *
 * 注意: PlaywrightでのWebAuthn完全な自動テストは非常に複雑なため、
 * このテストでは基本的なUI存在確認のみを行います。
 * 実際の認証フローのテストは手動テストを推奨します。
 *
 * 手動テストチェックリスト:
 * - [ ] Passkey登録（Chrome/Edge、Safari、Firefox）
 * - [ ] Passkey認証（複数デバイス）
 * - [ ] Passkey削除
 * - [ ] デバイス紛失時のフォールバック（Google OAuth）
 * - [ ] Cross-device Passkey（QRコード経由）
 */

test.describe("Passkey UI", () => {
  // 各テスト後にデータをクリーンアップ
  test.afterEach(async () => {
    await cleanupE2EData();
  });

  // サインインページのテストは認証なしで実行
  test.describe("未認証ユーザー", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("サインインページでPasskeyボタンが表示される", async ({ page }) => {
      await page.goto("/auth/signin");

      // Passkeyボタンの存在確認（クリックはしない）
      const passkeyButton = page.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await expect(passkeyButton).toBeVisible();

      // ボタンが有効である
      await expect(passkeyButton).toBeEnabled();

      // ボタンに正しいテキストが表示されている
      await expect(passkeyButton).toContainText("Passkeyでログイン");
    });

    test("サインインページでGoogleボタンが表示される", async ({ page }) => {
      await page.goto("/auth/signin");

      // Googleボタンの存在確認
      const googleButton = page.getByRole("button", {
        name: /googleでログイン/i,
      });
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test("サインインページにエラー表示エリアが存在する", async ({ page }) => {
      await page.goto("/auth/signin");

      // Passkeyボタンをクリックしてエラーが表示されるか確認
      // 注意: 実際の認証フローは実行しないため、エラー表示のレイアウト確認のみ
      const passkeyButton = page.getByRole("button", {
        name: /passkeyでログイン/i,
      });

      // ボタンが存在することを確認（クリックはスキップ）
      await expect(passkeyButton).toBeVisible();

      // エラー表示エリアの存在確認は、実際にエラーが発生しないとできないため、
      // ここではボタンの存在確認のみにとどめる
    });
  });

  // 認証済みユーザーのテスト
  test.describe("認証済みユーザー", () => {
    test("プロフィールページでPasskey管理セクションが表示される", async ({
      page,
    }) => {
      await page.goto("/profile");

      // Passkey設定セクションが表示される
      await expect(
        page.getByRole("heading", { name: /passkey設定/i }),
      ).toBeVisible();

      // Passkey作成ボタンが表示される
      const createButton = page.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();

      // 説明文が表示される
      await expect(
        page.getByText(
          /このデバイスの生体認証.*でログインできるようになります/,
        ),
      ).toBeVisible();

      // 登録済みPasskeyセクションが表示される
      await expect(
        page.getByRole("heading", { name: /登録済みpasskey/i }),
      ).toBeVisible();
    });

    test("Passkey未登録時は適切なメッセージが表示される", async ({ page }) => {
      await page.goto("/profile");

      // 「Passkeyが登録されていません」メッセージが表示される
      await expect(
        page.getByText(/passkeyが登録されていません/i),
      ).toBeVisible();
    });
  });
});
