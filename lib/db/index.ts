import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// MySQL接続設定
// 既存のrecordingAnniversaries8と同じDBを使用（変更禁止）
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Connection pool作成
const poolConnection = mysql.createPool(connectionString);

// Drizzle instance
export const db = drizzle(poolConnection, { schema, mode: "default" });

// Type exports
export { schema };
export type * from "./schema";
