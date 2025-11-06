import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/db/schema";

// .env.localから環境変数を読み込み
config({ path: ".env.local" });

let connection: mysql.Connection | null = null;
let testDb: MySql2Database<typeof schema> | null = null;

/**
 * テストDB接続を取得
 */
export async function getTestDb(): Promise<MySql2Database<typeof schema>> {
  if (testDb) return testDb;

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not set");
  }

  connection = await mysql.createConnection(connectionString);
  testDb = drizzle(connection, { schema, mode: "default" });

  return testDb;
}

/**
 * E2Eテスト用ユーザーを作成（存在する場合は更新）
 */
export async function seedE2EUser() {
  const db = await getTestDb();

  await db
    .insert(schema.users)
    .values({
      id: "e2e-user-id",
      email: "e2e@example.com",
      name: "E2E Test User",
    })
    .onDuplicateKeyUpdate({
      set: {
        email: "e2e@example.com",
        name: "E2E Test User",
      },
    });

  console.log("✅ E2E user seeded");
}

/**
 * E2Eテスト用データをクリーンアップ
 * ※セッションは削除しない（Setup Projectで作成したセッションを保持）
 */
export async function cleanupE2EData() {
  const db = await getTestDb();

  // CASCADE削除により、anniversariesも自動削除される
  await db
    .delete(schema.collections)
    .where(eq(schema.collections.userId, "e2e-user-id"));

  console.log("🧹 E2E data cleaned up");
}

/**
 * 全テーブルをTRUNCATE（テストDB初期化用）
 */
export async function truncateAllTables() {
  const db = await getTestDb();

  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`TRUNCATE TABLE anniversaries`);
  await db.execute(sql`TRUNCATE TABLE collections`);
  await db.execute(sql`TRUNCATE TABLE sessions`);
  await db.execute(sql`TRUNCATE TABLE accounts`);
  await db.execute(sql`TRUNCATE TABLE users`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

  console.log("🧹 All tables truncated");
}

/**
 * DB接続をクローズ
 */
export async function closeTestDb() {
  if (connection) {
    await connection.end();
    connection = null;
    testDb = null;
    console.log("🔌 Test DB connection closed");
  }
}
