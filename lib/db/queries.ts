import { and, asc, eq } from "drizzle-orm";
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
    const result = await db.insert(collections).values(data);
    return result[0].insertId;
  },

  async update(
    id: number,
    userId: string,
    data: { name?: string; description?: string | null; isVisible?: number },
  ) {
    await db
      .update(collections)
      .set(data)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
  },

  async delete(id: number, userId: string) {
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
    const anniversary = await db.query.anniversaries.findFirst({
      where: eq(anniversaries.id, id),
      with: {
        collection: true,
      },
    });

    // 記念日が見つからない、またはコレクションの所有者が異なる場合はnull
    if (
      !anniversary ||
      !anniversary.collection ||
      anniversary.collection.userId !== userId
    ) {
      return null;
    }

    return anniversary;
  },

  async create(data: {
    collectionId: number;
    name: string;
    description?: string | null;
    anniversaryDate: string;
  }) {
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
    if (!anniversary || !anniversary.collection) return;

    await db.update(anniversaries).set(data).where(eq(anniversaries.id, id));
  },

  async delete(id: number, userId: string) {
    const anniversary = await anniversaryQueries.findById(id, userId);
    if (!anniversary || !anniversary.collection) return;

    await db.delete(anniversaries).where(eq(anniversaries.id, id));
  },
};
