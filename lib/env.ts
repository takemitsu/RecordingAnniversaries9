import { z } from "zod";

/**
 * サーバー側環境変数スキーマ
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  TZ: z.string().default("Asia/Tokyo"),
  NEXT_TELEMETRY_DISABLED: z.string().optional(),
});

/**
 * クライアント側環境変数スキーマ（NEXT_PUBLIC_*）
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  // Passkey関連（未実装のためoptional）
  NEXT_PUBLIC_WEBAUTHN_RP_ID: z.string().optional(),
  NEXT_PUBLIC_WEBAUTHN_RP_NAME: z.string().optional(),
  NEXT_PUBLIC_WEBAUTHN_ORIGIN: z.string().url().optional(),
});

/**
 * 全環境変数スキーマ
 */
const envSchema = serverSchema.merge(clientSchema);

/**
 * 環境変数のバリデーション
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

/**
 * 型安全な環境変数
 */
export const env = parsed.data;

/**
 * TypeScript型拡張（process.envの自動補完対応）
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
