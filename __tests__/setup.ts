import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { config } from "dotenv";
import { afterEach, vi } from "vitest";

// .env.localを読み込む（テスト用DB接続に必要）
config({ path: ".env.local" });

// Next.jsのrevalidatePathとredirectをモック（テスト環境では動作しないため）
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
