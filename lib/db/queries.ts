import { db } from "./index";
import { users, entities, days } from "./schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import type { Entity, Day } from "./schema";

/**
 * ユーザー関連のクエリ
 */
export const userQueries = {
  // メールアドレスでユーザーを検索
  findByEmail: async (email: string) => {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  // Google IDでユーザーを検索
  findByGoogleId: async (googleId: string) => {
    return await db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });
  },

  // IDでユーザーを検索
  findById: async (id: number) => {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },
};

/**
 * Entities関連のクエリ
 * ソフトデリート対応（deleted_at が null のもののみ取得）
 */
export const entityQueries = {
  // ユーザーの全Entitiesを取得（削除済みを除外）
  findByUserId: async (userId: number) => {
    return await db.query.entities.findMany({
      where: and(
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ),
      orderBy: desc(entities.createdAt),
      with: {
        days: {
          where: isNull(days.deletedAt),
          orderBy: days.annivAt,
        },
      },
    });
  },

  // 特定のEntityを取得
  findById: async (id: number, userId: number) => {
    return await db.query.entities.findFirst({
      where: and(
        eq(entities.id, id),
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ),
      with: {
        days: {
          where: isNull(days.deletedAt),
          orderBy: days.annivAt,
        },
      },
    });
  },

  // Entityを作成
  create: async (data: { userId: number; name: string; desc?: string | null; status?: number }) => {
    const result = await db.insert(entities).values(data);
    return result[0].insertId;
  },

  // Entityを更新
  update: async (id: number, userId: number, data: { name?: string; desc?: string | null; status?: number }) => {
    await db
      .update(entities)
      .set(data)
      .where(and(
        eq(entities.id, id),
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ));
  },

  // Entityをソフトデリート
  softDelete: async (id: number, userId: number) => {
    await db
      .update(entities)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(entities.id, id),
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ));
  },
};

/**
 * Days関連のクエリ
 * ソフトデリート対応（deleted_at が null のもののみ取得）
 */
export const dayQueries = {
  // Entity内の全Daysを取得（削除済みを除外）
  findByEntityId: async (entityId: number, userId: number) => {
    // まずEntityが存在し、ユーザーのものであることを確認
    const entity = await db.query.entities.findFirst({
      where: and(
        eq(entities.id, entityId),
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ),
    });

    if (!entity) return [];

    return await db.query.days.findMany({
      where: and(
        eq(days.entityId, entityId),
        isNull(days.deletedAt)
      ),
      orderBy: days.annivAt,
    });
  },

  // 特定のDayを取得
  findById: async (id: number, userId: number) => {
    return await db.query.days.findFirst({
      where: and(
        eq(days.id, id),
        isNull(days.deletedAt)
      ),
      with: {
        entity: {
          where: and(
            eq(entities.userId, userId),
            isNull(entities.deletedAt)
          ),
        },
      },
    });
  },

  // Dayを作成
  create: async (data: { entityId: number; name: string; desc?: string | null; annivAt: string }) => {
    const result = await db.insert(days).values(data);
    return result[0].insertId;
  },

  // Dayを更新
  update: async (id: number, userId: number, data: { name?: string; desc?: string | null; annivAt?: string }) => {
    // まずDayが存在し、ユーザーのものであることを確認
    const day = await dayQueries.findById(id, userId);
    if (!day || !day.entity) return;

    await db
      .update(days)
      .set(data)
      .where(and(
        eq(days.id, id),
        isNull(days.deletedAt)
      ));
  },

  // Dayをソフトデリート
  softDelete: async (id: number, userId: number) => {
    // まずDayが存在し、ユーザーのものであることを確認
    const day = await dayQueries.findById(id, userId);
    if (!day || !day.entity) return;

    await db
      .update(days)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(days.id, id),
        isNull(days.deletedAt)
      ));
  },

  // ユーザーの全Daysを取得（全Entitiesから）
  findAllByUserId: async (userId: number) => {
    const userEntities = await db.query.entities.findMany({
      where: and(
        eq(entities.userId, userId),
        isNull(entities.deletedAt)
      ),
      with: {
        days: {
          where: isNull(days.deletedAt),
          orderBy: days.annivAt,
        },
      },
    });

    // 全てのDaysをフラットな配列にする
    return userEntities.flatMap(entity =>
      entity.days.map(day => ({
        ...day,
        entity: {
          id: entity.id,
          name: entity.name,
          desc: entity.desc,
          status: entity.status,
        },
      }))
    );
  },
};
