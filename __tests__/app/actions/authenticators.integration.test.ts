import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestUser } from "@/__tests__/helpers/db";
import {
  deleteAuthenticator,
  getAuthenticators,
} from "@/app/actions/authenticators";
import { db } from "@/lib/db/index";
import { authenticators } from "@/lib/db/schema";

// 認証モック（test-user-idを返す）
vi.mock("@/lib/auth-helpers", () => ({
  getUserId: vi.fn(async () => "test-user-id"),
  requireAuth: vi.fn(async () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  verifyUserAccess: vi.fn(async () => {
    // テスト環境では常に成功
  }),
}));

describe("Authenticators Integration Tests", () => {
  afterEach(async () => {
    // 各テスト後にデータクリーンアップ
    await cleanupTestDb();
  });

  describe("getAuthenticators", () => {
    it("ユーザーのPasskey一覧を取得できる", async () => {
      await createTestUser();

      // テスト用Passkeyを作成
      await db.insert(authenticators).values({
        credentialID: "test-credential-1",
        userId: "test-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "test-public-key-1",
        counter: 0,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: "internal",
      });

      await db.insert(authenticators).values({
        credentialID: "test-credential-2",
        userId: "test-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "test-public-key-2",
        counter: 1,
        credentialDeviceType: "multiDevice",
        credentialBackedUp: true,
        transports: "internal,hybrid",
      });

      const result = await getAuthenticators();

      expect(result).toHaveLength(2);
      expect(result[0].credentialID).toBe("test-credential-1");
      expect(result[1].credentialID).toBe("test-credential-2");
    });

    it("他のユーザーのPasskeyは取得できない（権限分離）", async () => {
      await createTestUser();
      await createTestUser("other-user-id", "other@example.com", "Other User");

      // test-user-id のPasskey
      await db.insert(authenticators).values({
        credentialID: "test-credential-1",
        userId: "test-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "test-public-key-1",
        counter: 0,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: "internal",
      });

      // other-user-id のPasskey
      await db.insert(authenticators).values({
        credentialID: "other-credential-1",
        userId: "other-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "other-public-key-1",
        counter: 0,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: "internal",
      });

      const result = await getAuthenticators();

      // test-user-idのPasskeyのみ取得できる
      expect(result).toHaveLength(1);
      expect(result[0].credentialID).toBe("test-credential-1");
      expect(result[0].userId).toBe("test-user-id");
    });

    it("Passkeyがない場合は空配列を返す", async () => {
      await createTestUser();

      const result = await getAuthenticators();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe("deleteAuthenticator", () => {
    it("Passkeyを削除できる", async () => {
      await createTestUser();

      await db.insert(authenticators).values({
        credentialID: "test-credential-1",
        userId: "test-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "test-public-key-1",
        counter: 0,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: "internal",
      });

      const result = await deleteAuthenticator("test-credential-1");

      expect(result.success).toBe(true);

      // DBから削除されていることを確認
      const remaining = await db.query.authenticators.findMany();
      expect(remaining).toHaveLength(0);
    });

    it("他のユーザーのPasskeyは削除できない（権限分離）", async () => {
      await createTestUser();
      await createTestUser("other-user-id", "other@example.com", "Other User");

      // other-user-id のPasskey
      await db.insert(authenticators).values({
        credentialID: "other-credential-1",
        userId: "other-user-id",
        providerAccountId: "passkey",
        credentialPublicKey: "other-public-key-1",
        counter: 0,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: "internal",
      });

      // 削除試行（test-user-idとして実行）
      const result = await deleteAuthenticator("other-credential-1");

      // 成功と返るが（該当データなしで影響なし）
      expect(result.success).toBe(true);

      // DBには残っている（削除されていない）
      const remaining = await db.query.authenticators.findMany();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].credentialID).toBe("other-credential-1");
      expect(remaining[0].userId).toBe("other-user-id");
    });

    it("存在しないPasskeyを削除しようとしても成功と返る", async () => {
      await createTestUser();

      const result = await deleteAuthenticator("non-existent-credential");

      // 該当データなしでも成功と返る（冪等性）
      expect(result.success).toBe(true);
    });
  });
});
