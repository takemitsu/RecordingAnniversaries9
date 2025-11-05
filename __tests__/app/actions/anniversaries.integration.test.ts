import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestUser } from "@/__tests__/helpers/db";
import {
  createAnniversary,
  deleteAnniversary,
  getAnniversary,
  updateAnniversary,
} from "@/app/actions/anniversaries";
import { db } from "@/lib/db/index";
import { anniversaries, collections } from "@/lib/db/schema";

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

describe("Anniversaries Integration Tests", () => {
  let collectionId: number;

  afterEach(async () => {
    // 各テスト後にデータクリーンアップ
    await cleanupTestDb();
  });

  // 各テストでCollection作成
  async function setupCollection() {
    await createTestUser();

    const [collection] = await db
      .insert(collections)
      .values({
        userId: "test-user-id",
        name: "家族",
        isVisible: 1,
      })
      .$returningId();

    return collection.id;
  }

  describe("createAnniversary", () => {
    it("有効なデータでAnniversary作成成功", async () => {
      collectionId = await setupCollection();

      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-11-04");
      formData.append("description", "家族の誕生日");
      formData.append("collectionId", collectionId.toString());

      const result = await createAnniversary(null, formData);

      // 成功時はエラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから直接確認
      const dbAnniversaries = await db.query.anniversaries.findMany();
      expect(dbAnniversaries).toHaveLength(1);
      expect(dbAnniversaries[0].name).toBe("誕生日");
      expect(dbAnniversaries[0].anniversaryDate).toBe("2020-11-04");
      expect(dbAnniversaries[0].description).toBe("家族の誕生日");
      expect(dbAnniversaries[0].collectionId).toBe(collectionId);
    });

    it("バリデーションエラー: 名前が空", async () => {
      collectionId = await setupCollection();

      const formData = new FormData();
      formData.append("name", ""); // 空
      formData.append("anniversaryDate", "2020-11-04");
      formData.append("collectionId", collectionId.toString());

      const result = await createAnniversary(null, formData);

      // バリデーションエラーがあることを確認
      expect(result?.errors?.name).toBeTruthy();

      // DBには保存されていない
      const dbAnniversaries = await db.query.anniversaries.findMany();
      expect(dbAnniversaries).toHaveLength(0);
    });

    it("バリデーションエラー: 無効な日付形式", async () => {
      collectionId = await setupCollection();

      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-13-32"); // 無効
      formData.append("collectionId", collectionId.toString());

      const result = await createAnniversary(null, formData);

      // バリデーションエラーがあることを確認
      expect(result?.errors?.anniversaryDate).toBeTruthy();
    });

    it("存在しないCollectionには作成できない", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-11-04");
      formData.append("collectionId", "99999"); // 存在しないID

      const result = await createAnniversary(null, formData);

      // エラーメッセージがあることを確認
      expect(result?.error).toContain("見つかりません");
    });
  });

  describe("updateAnniversary", () => {
    it("Anniversary更新成功", async () => {
      collectionId = await setupCollection();

      // 事前にAnniversary作成
      const [anniversary] = await db
        .insert(anniversaries)
        .values({
          collectionId,
          name: "元の名前",
          anniversaryDate: "2020-01-01",
          description: "元の説明",
        })
        .$returningId();

      const formData = new FormData();
      formData.append("anniversaryId", anniversary.id.toString());
      formData.append("collectionId", collectionId.toString());
      formData.append("name", "更新後の名前");
      formData.append("anniversaryDate", "2020-12-31");
      formData.append("description", "更新後の説明");

      const result = await updateAnniversary(null, formData);

      // 成功時はエラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから確認
      const updated = await db.query.anniversaries.findFirst({
        where: (a, { eq }) => eq(a.id, anniversary.id),
      });
      expect(updated?.name).toBe("更新後の名前");
      expect(updated?.anniversaryDate).toBe("2020-12-31");
      expect(updated?.description).toBe("更新後の説明");
    });

    it("存在しないAnniversaryは更新できない", async () => {
      collectionId = await setupCollection();

      const formData = new FormData();
      formData.append("anniversaryId", "99999"); // 存在しないID
      formData.append("collectionId", collectionId.toString());
      formData.append("name", "更新");
      formData.append("anniversaryDate", "2020-11-04");

      const result = await updateAnniversary(null, formData);

      // エラーメッセージがあることを確認
      expect(result?.error).toContain("見つかりません");
    });
  });

  describe("deleteAnniversary", () => {
    it("Anniversary削除成功", async () => {
      collectionId = await setupCollection();

      // Anniversary作成
      const [anniversary] = await db
        .insert(anniversaries)
        .values({
          collectionId,
          name: "削除対象",
          anniversaryDate: "2020-11-04",
        })
        .$returningId();

      const result = await deleteAnniversary(anniversary.id);

      // 成功時は success: true
      expect(result.success).toBe(true);

      // DBから削除されていることを確認
      const deleted = await db.query.anniversaries.findFirst({
        where: (a, { eq }) => eq(a.id, anniversary.id),
      });
      expect(deleted).toBeUndefined();
    });

    it("存在しないAnniversaryは削除できない", async () => {
      collectionId = await setupCollection();

      const result = await deleteAnniversary(99999);

      // エラーメッセージがあることを確認
      expect(result.error).toBeTruthy();
    });
  });

  describe("getAnniversary", () => {
    it("指定したAnniversaryを取得", async () => {
      collectionId = await setupCollection();

      const [anniversary] = await db
        .insert(anniversaries)
        .values({
          collectionId,
          name: "誕生日",
          anniversaryDate: "2020-11-04",
          description: "家族の誕生日",
        })
        .$returningId();

      const result = await getAnniversary(anniversary.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe("誕生日");
      expect(result?.anniversaryDate).toBe("2020-11-04");
      expect(result?.description).toBe("家族の誕生日");
    });

    it("存在しないAnniversaryはundefined", async () => {
      await createTestUser();

      const result = await getAnniversary(99999);

      expect(result).toBeUndefined();
    });
  });
});
