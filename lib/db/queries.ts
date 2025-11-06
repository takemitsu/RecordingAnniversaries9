import { and, asc, eq } from "drizzle-orm";
import { verifyUserAccess } from "@/lib/auth-helpers";
import { calculateDiffDays } from "@/lib/utils/dateCalculation";
import { db } from "./index";
import { anniversaries, collections } from "./schema";

/**
 * コレクション（グループ）関連のクエリ
 */
export const collectionQueries = {
  /**
   * ユーザーIDで全コレクションを取得
   * 記念日は次の記念日までの日数が少ない順にソート
   */
  async findByUserId(userId: string) {
    await verifyUserAccess(userId);

    const result = await db.query.collections.findMany({
      where: eq(collections.userId, userId),
      orderBy: asc(collections.createdAt),
      with: {
        anniversaries: true,
      },
    });

    // 記念日を次の記念日までの日数でソート（今日が0日、昨日が364日）
    return result.map((collection) => ({
      ...collection,
      anniversaries: collection.anniversaries.slice().sort((a, b) => {
        const diffA = calculateDiffDays(a.anniversaryDate);
        const diffB = calculateDiffDays(b.anniversaryDate);
        if (diffA === null) return 1;
        if (diffB === null) return -1;
        return diffA - diffB;
      }),
    }));
  },

  /**
   * コレクションIDとユーザーIDで1件取得
   * セキュリティ: userIdで所有者確認を行う
   */
  async findById(id: number, userId: string) {
    await verifyUserAccess(userId);

    return await db.query.collections.findFirst({
      where: and(eq(collections.id, id), eq(collections.userId, userId)),
    });
  },

  async create(data: {
    userId: string;
    name: string;
    description?: string | null;
    isVisible?: number;
  }) {
    await verifyUserAccess(data.userId);

    const result = await db.insert(collections).values(data);
    return result[0].insertId;
  },

  async update(
    id: number,
    userId: string,
    data: { name?: string; description?: string | null; isVisible?: number },
  ) {
    await verifyUserAccess(userId);

    // 存在確認
    const existing = await collectionQueries.findById(id, userId);
    if (!existing) {
      throw new Error("Collection not found or access denied");
    }

    await db
      .update(collections)
      .set(data)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
  },

  async delete(id: number, userId: string) {
    await verifyUserAccess(userId);

    // Collection存在確認
    const collection = await collectionQueries.findById(id, userId);
    if (!collection) {
      throw new Error("Collection not found or access denied");
    }

    // CASCADE設定により、Anniversariesも自動削除される
    await db
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
  },
};

/**
 * 記念日関連のクエリ
 */
export const anniversaryQueries = {
  /**
   * 記念日IDで1件取得
   * セキュリティ: コレクションを経由してユーザー所有確認
   */
  async findById(id: number, userId: string) {
    await verifyUserAccess(userId);

    const anniversary = await db.query.anniversaries.findFirst({
      where: eq(anniversaries.id, id),
      with: {
        collection: true,
      },
    });

    // 記念日が見つからない、またはコレクションの所有者が異なる場合はundefined
    if (
      !anniversary ||
      !anniversary.collection ||
      anniversary.collection.userId !== userId
    ) {
      return undefined;
    }

    return anniversary;
  },

  async create(data: {
    collectionId: number;
    name: string;
    description?: string | null;
    anniversaryDate: string;
  }) {
    // Collection所有権確認
    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, data.collectionId),
    });
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Data Layer認証チェック（多層防御）
    await verifyUserAccess(collection.userId);

    const result = await db.insert(anniversaries).values(data);
    return result[0].insertId;
  },

  async update(
    id: number,
    userId: string,
    data: {
      name?: string;
      description?: string | null;
      anniversaryDate?: string;
    },
  ) {
    const anniversary = await anniversaryQueries.findById(id, userId);
    if (!anniversary || !anniversary.collection) {
      throw new Error("Anniversary not found or access denied");
    }

    await db.update(anniversaries).set(data).where(eq(anniversaries.id, id));
  },

  async delete(id: number, userId: string) {
    const anniversary = await anniversaryQueries.findById(id, userId);
    if (!anniversary || !anniversary.collection) {
      throw new Error("Anniversary not found or access denied");
    }

    await db.delete(anniversaries).where(eq(anniversaries.id, id));
  },
};
