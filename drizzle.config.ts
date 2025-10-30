import type { Config } from "drizzle-kit";

// Drizzle Kit設定
// 注意: 既存のrecordingAnniversaries8が使用中のDBのため、
//       既存テーブルは変更しない
//       tablesFilterで管理対象テーブルを限定
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  // Next.js（recordingAnniversaries9）が管理するテーブルのみ指定
  // 既存のLaravelテーブル（users, entities, days）は除外して保護
  tablesFilter: ["accounts", "auth_sessions"],
  verbose: true,
  strict: true,
} satisfies Config;
