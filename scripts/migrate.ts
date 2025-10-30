import { config } from "dotenv";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// .env.localを読み込み
config({ path: ".env.local" });

async function runMigration() {
  console.log("Running migrations...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // マイグレーション用のシングルコネクション作成
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // マイグレーション実行
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✓ Migrations completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    await connection.end();
    process.exit(1);
  }

  // 接続を閉じる
  await connection.end();
  console.log("Connection closed");
  process.exit(0);
}

runMigration();
