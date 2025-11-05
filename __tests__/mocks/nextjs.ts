import { vi } from "vitest";

/**
 * Next.jsのサーバー関数をモック化
 * テストでは実際のリダイレクトやキャッシュ無効化を行わない
 */
export function mockNextjsServerFunctions() {
  // next/cache の revalidatePath をモック
  vi.mock("next/cache", () => ({
    revalidatePath: vi.fn((_path: string) => {
      // テストでは何もしない（ログだけ）
      // console.log(`[Mock] revalidatePath: ${_path}`);
    }),
  }));

  // next/navigation の redirect をモック
  vi.mock("next/navigation", () => ({
    redirect: vi.fn((path: string) => {
      // リダイレクトの代わりにエラーをthrow（Server Actionsの仕様）
      throw new Error(`REDIRECT: ${path}`);
    }),
  }));
}

/**
 * モック関数をリセット
 */
export function resetMocks() {
  vi.clearAllMocks();
}
