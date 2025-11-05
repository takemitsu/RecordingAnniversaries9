import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestUser } from "@/__tests__/helpers/db";
import { updateProfile } from "@/app/actions/profile";
import { db } from "@/lib/db/index";

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

describe("Profile Integration Tests", () => {
  afterEach(async () => {
    // 各テスト後にデータクリーンアップ
    await cleanupTestDb();
  });

  describe("updateProfile", () => {
    it("プロフィール更新成功", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "更新後の名前");

      const result = await updateProfile(null, formData);

      // 成功時はエラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから確認
      const updated = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, "test-user-id"),
      });
      expect(updated?.name).toBe("更新後の名前");
    });

    it("バリデーションエラー: 名前が空", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", ""); // 空

      const result = await updateProfile(null, formData);

      // バリデーションエラーがあることを確認
      expect(result?.error).toBeTruthy();

      // DBは更新されていない
      const notUpdated = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, "test-user-id"),
      });
      expect(notUpdated?.name).toBe("Test User"); // 元の名前のまま
    });

    it("名前を空にできない", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "   "); // 空白のみ

      const result = await updateProfile(null, formData);

      // バリデーションエラーがあることを確認
      expect(result?.error).toBeTruthy();
    });
  });
});
