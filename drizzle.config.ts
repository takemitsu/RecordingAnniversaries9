import type { Config } from "drizzle-kit";

// Drizzle Kit設定
// 注意: 既存のrecordingAnniversaries8が使用中のDBのため、
//       マイグレーション（push/migrate）は実行しないこと
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
  verbose: true,
  strict: true,
} satisfies Config;
