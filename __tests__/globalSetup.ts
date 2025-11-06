import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

/**
 * 全テスト実行前に一度だけ実行
 * テストDBにマイグレーションを適用
 */
export default async function globalSetup() {
  // .env.localを読み込む
  config({ path: ".env.local" });

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not set");
  }

  console.log("🔧 Setting up test database...");

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection);

    // マイグレーション実行
    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("✅ Test database setup complete");
  } catch (error) {
    console.error("❌ Test database setup failed:", error);
    if (connection) {
      await connection.end();
    }
    throw error; // テスト全体を失敗させる
  }

  await connection.end();
}
