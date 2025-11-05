import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestUser } from "@/__tests__/helpers/db";
import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollections,
  getCollectionsWithAnniversaries,
  updateCollection,
} from "@/app/actions/collections";
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

describe("Collections Integration Tests", () => {
  afterEach(async () => {
    // 各テスト後にデータクリーンアップ
    await cleanupTestDb();
  });

  describe("createCollection", () => {
    it("有効なデータでCollection作成成功", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "家族");
      formData.append("description", "家族の記念日");
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      // 成功時は null または undefined、エラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから直接確認
      const dbCollections = await db.query.collections.findMany();
      expect(dbCollections).toHaveLength(1);
      expect(dbCollections[0].name).toBe("家族");
      expect(dbCollections[0].description).toBe("家族の記念日");
      expect(dbCollections[0].isVisible).toBe(1);
      expect(dbCollections[0].userId).toBe("test-user-id");
    });

    it("バリデーションエラー: 名前が空", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", ""); // 空
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      // バリデーションエラーがあることを確認
      expect(result?.errors?.name).toBeTruthy();

      // DBには保存されていない
      const dbCollections = await db.query.collections.findMany();
      expect(dbCollections).toHaveLength(0);
    });

    it("isVisibleのデフォルト値", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "友人");

      const result = await createCollection(null, formData);

      // 成功時はエラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      const dbCollections = await db.query.collections.findMany();
      expect(dbCollections[0].isVisible).toBe(1); // デフォルト
    });
  });

  describe("updateCollection", () => {
    it("Collection更新成功", async () => {
      await createTestUser();

      // 事前にCollection作成
      const [collection] = await db
        .insert(collections)
        .values({
          userId: "test-user-id",
          name: "元の名前",
          description: "元の説明",
          isVisible: 1,
        })
        .$returningId();

      const formData = new FormData();
      formData.append("collectionId", collection.id.toString());
      formData.append("name", "更新後の名前");
      formData.append("description", "更新後の説明");
      formData.append("isVisible", "0");

      const result = await updateCollection(null, formData);

      // 成功時はエラーがないことを確認
      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから確認
      const updated = await db.query.collections.findFirst({
        where: (c, { eq }) => eq(c.id, collection.id),
      });
      expect(updated?.name).toBe("更新後の名前");
      expect(updated?.description).toBe("更新後の説明");
      expect(updated?.isVisible).toBe(0);
    });

    it("存在しないCollectionは更新できない", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("collectionId", "99999"); // 存在しないID
      formData.append("name", "更新");

      const result = await updateCollection(null, formData);

      // エラーメッセージがあることを確認
      expect(result?.error).toContain("見つかりません");
    });
  });

  describe("deleteCollection", () => {
    it("記念日がないCollectionは削除成功", async () => {
      await createTestUser();

      // Collection作成
      const [collection] = await db
        .insert(collections)
        .values({
          userId: "test-user-id",
          name: "削除対象",
          isVisible: 1,
        })
        .$returningId();

      const result = await deleteCollection(collection.id);

      // 成功時は success: true
      expect(result.success).toBe(true);

      // DBから削除されていることを確認
      const deleted = await db.query.collections.findFirst({
        where: (c, { eq }) => eq(c.id, collection.id),
      });
      expect(deleted).toBeUndefined();
    });

    it("記念日があるCollectionを削除するとAnniversariesもCASCADE削除される", async () => {
      await createTestUser();

      // Collection作成
      const [collection] = await db
        .insert(collections)
        .values({
          userId: "test-user-id",
          name: "削除対象",
          isVisible: 1,
        })
        .$returningId();

      // Anniversary追加
      await db.insert(anniversaries).values({
        collectionId: collection.id,
        name: "誕生日",
        anniversaryDate: "2020-11-04",
      });

      const result = await deleteCollection(collection.id);

      // 成功
      expect(result.success).toBe(true);

      // Collectionが削除されている
      const deletedCollection = await db.query.collections.findFirst({
        where: (c, { eq }) => eq(c.id, collection.id),
      });
      expect(deletedCollection).toBeUndefined();

      // Anniversariesも削除されている（CASCADE）
      const deletedAnniversaries = await db.query.anniversaries.findMany({
        where: (a, { eq }) => eq(a.collectionId, collection.id),
      });
      expect(deletedAnniversaries).toHaveLength(0);
    });
  });

  describe("getCollections", () => {
    it("ユーザーのCollectionsを取得", async () => {
      await createTestUser();

      // 複数のCollection作成
      await db.insert(collections).values([
        { userId: "test-user-id", name: "家族", isVisible: 1 },
        { userId: "test-user-id", name: "友人", isVisible: 1 },
      ]);

      const result = await getCollections();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("家族");
      expect(result[1].name).toBe("友人");
    });

    it("他ユーザーのCollectionsは取得できない", async () => {
      await createTestUser();
      await createTestUser("other-user", "other@example.com", "Other User");

      // 自分のCollection
      await db.insert(collections).values({
        userId: "test-user-id",
        name: "自分のCollection",
        isVisible: 1,
      });

      // 他ユーザーのCollection
      await db.insert(collections).values({
        userId: "other-user",
        name: "他ユーザーのCollection",
        isVisible: 1,
      });

      const result = await getCollections();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("自分のCollection");
    });

    it("空配列を返す（Collectionがない場合）", async () => {
      await createTestUser();

      const result = await getCollections();

      expect(result).toHaveLength(0);
    });
  });

  describe("getCollection", () => {
    it("指定したCollectionを取得", async () => {
      await createTestUser();

      const [collection] = await db
        .insert(collections)
        .values({
          userId: "test-user-id",
          name: "家族",
          description: "家族の記念日",
          isVisible: 1,
        })
        .$returningId();

      const result = await getCollection(collection.id);

      expect(result).toBeDefined();
      expect(result?.name).toBe("家族");
      expect(result?.description).toBe("家族の記念日");
    });

    it("存在しないCollectionはundefined", async () => {
      await createTestUser();

      const result = await getCollection(99999);

      expect(result).toBeUndefined();
    });
  });

  describe("getCollectionsWithAnniversaries", () => {
    it("記念日を含むCollectionsを取得", async () => {
      await createTestUser();

      // Collection作成
      const [collection] = await db
        .insert(collections)
        .values({
          userId: "test-user-id",
          name: "家族",
          isVisible: 1,
        })
        .$returningId();

      // Anniversary追加
      await db.insert(anniversaries).values([
        {
          collectionId: collection.id,
          name: "誕生日",
          anniversaryDate: "2020-11-04",
        },
        {
          collectionId: collection.id,
          name: "結婚記念日",
          anniversaryDate: "2014-11-01",
        },
      ]);

      const result = await getCollectionsWithAnniversaries();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("家族");
      expect(result[0].anniversaries).toHaveLength(2);
    });

    it("isVisible=0のCollectionは除外", async () => {
      await createTestUser();

      const [collection1, collection2] = await db
        .insert(collections)
        .values([
          { userId: "test-user-id", name: "表示", isVisible: 1 },
          { userId: "test-user-id", name: "非表示", isVisible: 0 },
        ])
        .$returningId();

      // 両方のCollectionに記念日を追加
      await db.insert(anniversaries).values([
        {
          collectionId: collection1.id,
          name: "表示用の記念日",
          anniversaryDate: "2020-11-04",
        },
        {
          collectionId: collection2.id,
          name: "非表示用の記念日",
          anniversaryDate: "2020-11-05",
        },
      ]);

      const result = await getCollectionsWithAnniversaries();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("表示");
    });
  });
});
