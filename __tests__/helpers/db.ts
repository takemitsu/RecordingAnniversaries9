import { sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";

/**
 * テストデータクリーンアップ
 * afterEach()で毎回実行し、テスト間の独立性を保つ
 */
export async function cleanupTestDb() {
  // 外部キー制約を一時的に無効化
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

  // 全テーブルをTRUNCATE（AUTO_INCREMENTもリセット）
  await db.execute(sql`TRUNCATE TABLE anniversaries`);
  await db.execute(sql`TRUNCATE TABLE collections`);
  await db.execute(sql`TRUNCATE TABLE authenticators`);
  await db.execute(sql`TRUNCATE TABLE users`);
  await db.execute(sql`TRUNCATE TABLE sessions`);
  await db.execute(sql`TRUNCATE TABLE accounts`);

  // 外部キー制約を再度有効化
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

/**
 * テストユーザー作成
 * 認証モックと連携して、test-user-idのユーザーを作成
 */
export async function createTestUser(
  userId = "test-user-id",
  email = "test@example.com",
  name = "Test User",
) {
  await db.insert(users).values({
    id: userId,
    email,
    name,
  });
  return userId;
}
