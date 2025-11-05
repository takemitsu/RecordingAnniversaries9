import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { cleanupE2EData, closeTestDb, seedE2EUser } from "./db-seed";

/**
 * Playwright Global Setup
 * 全E2Eテスト実行前に1回だけ実行される
 */
export default async function globalSetup() {
  // .env.localから環境変数を読み込み
  config({ path: ".env.local" });

  console.log("🔧 Setting up E2E test environment...");

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not set in .env.local");
  }

  let connection: mysql.Connection | null = null;

  try {
    // DB接続
    connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection);

    // マイグレーション実行
    console.log("📦 Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations complete");

    // 既存のE2Eデータをクリーンアップ
    await cleanupE2EData();

    // E2Eユーザーを作成
    await seedE2EUser();

    console.log("✅ E2E test environment setup complete");
  } catch (error) {
    console.error("❌ E2E test environment setup failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
    // db-seed.tsのコネクションもクローズ
    await closeTestDb();
  }
}
