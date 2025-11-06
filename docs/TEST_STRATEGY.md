# Recording Anniversaries 9 - テスト実装戦略

このドキュメントは、プロジェクトの包括的なテスト実装戦略を定義します。他のClaudeセッションでも迷わず実装できるよう、詳細な手順とコード例を含んでいます。

## 📋 概要

- **範囲**: 全Phase（Unit → Integration → Component → E2E）
- **期間**: 6-10日
- **DB戦略**: MySQL テストDB（`TEST_DATABASE_URL`）で実環境に近いテスト
- **ツール**: Vitest + React Testing Library + Playwright
- **優先度**: 日付計算 → 和暦 → Zod → Server Actions → Component → E2E

## 🎯 目標

- ✅ ビジネスロジック（日付計算、和暦変換）の正確性保証
- ✅ Server Actions（CRUD操作）の統合テスト
- ✅ UIコンポーネントのインタラクション確認
- ✅ ユーザーフロー全体のE2Eテスト
- ✅ カバレッジ目標: utils（90%+）、schemas（85%+）、actions（80%+）

---

## Phase 1: セットアップ + Unit Tests（1-2日）

### 1.1 依存関係インストール

```bash
# Vitest + React Testing Library
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @vitejs/plugin-react happy-dom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Playwright（E2E）
npm install -D @playwright/test

# SQLite（テストDB用）
npm install -D better-sqlite3 @types/better-sqlite3
```

### 1.2 Vitest設定ファイル作成

**`vitest.config.ts`**

```typescript
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "*.config.ts",
        ".next/",
        "drizzle/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

### 1.3 テストセットアップファイル

**`__tests__/setup.ts`**

```typescript
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
```

### 1.4 Playwright設定ファイル

**`playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.5 package.json スクリプト追加

**`package.json`に追加**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 1.6 Unit Tests実装

#### 1.6.1 日付計算ロジック（最優先）

**`__tests__/lib/utils/dateCalculation.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateDiffDays,
  formatCountdown,
  sortByClosest,
} from "@/lib/utils/dateCalculation";

describe("calculateDiffDays", () => {
  beforeEach(() => {
    // 今日を 2025-11-04 に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("未来日の場合、その日までの日数を返す", () => {
    expect(calculateDiffDays("2025-12-25")).toBe(51); // 51日後
  });

  it("今日が記念日の場合、0を返す", () => {
    expect(calculateDiffDays("2020-11-04")).toBe(0); // 月日が同じ
  });

  it("過去日で今年の記念日が既に過ぎている場合、来年までの日数", () => {
    expect(calculateDiffDays("2020-01-01")).toBe(58); // 2026-01-01まで
  });

  it("過去日で今年の記念日がまだの場合、今年の日数", () => {
    expect(calculateDiffDays("2020-12-31")).toBe(57); // 2025-12-31まで
  });

  it("nullの場合、nullを返す", () => {
    expect(calculateDiffDays(null)).toBeNull();
  });

  it("無効な日付の場合、nullを返す", () => {
    expect(calculateDiffDays("invalid-date")).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("日数を正しくフォーマット", () => {
    expect(formatCountdown(0)).toBe("今日");
    expect(formatCountdown(1)).toBe("明日");
    expect(formatCountdown(2)).toBe("あと2日");
    expect(formatCountdown(365)).toBe("あと365日");
  });

  it("nullの場合、空文字を返す", () => {
    expect(formatCountdown(null)).toBe("");
  });
});

describe("sortByClosest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("近い順にソート", () => {
    const anniversaries = [
      { anniversaryDate: "2020-12-31" }, // 57日後
      { anniversaryDate: "2020-11-10" }, // 6日後
      { anniversaryDate: "2020-01-01" }, // 58日後
    ];

    const sorted = sortByClosest(anniversaries);
    expect(sorted[0].anniversaryDate).toBe("2020-11-10"); // 最も近い
    expect(sorted[1].anniversaryDate).toBe("2020-12-31");
    expect(sorted[2].anniversaryDate).toBe("2020-01-01");
  });
});
```

#### 1.6.2 和暦変換

**`__tests__/lib/utils/japanDate.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { japanDate, getAges, getTodayForHeader } from "@/lib/utils/japanDate";

describe("japanDate", () => {
  it("令和を正しく変換", () => {
    expect(japanDate("2019-05-01")).toBe("令和元年5月1日");
    expect(japanDate("2025-11-04")).toBe("令和7年11月4日");
  });

  it("平成を正しく変換", () => {
    expect(japanDate("1989-01-08")).toBe("平成元年1月8日");
    expect(japanDate("2019-04-30")).toBe("平成31年4月30日");
  });

  it("昭和を正しく変換", () => {
    expect(japanDate("1926-12-25")).toBe("昭和元年12月25日");
    expect(japanDate("1989-01-07")).toBe("昭和64年1月7日");
  });

  it("大正を正しく変換", () => {
    expect(japanDate("1912-07-30")).toBe("大正元年7月30日");
    expect(japanDate("1926-12-24")).toBe("大正15年12月24日");
  });

  it("明治を正しく変換", () => {
    expect(japanDate("1868-01-25")).toBe("明治元年1月25日");
  });

  it("無効な日付は空文字", () => {
    expect(japanDate("invalid")).toBe("");
    expect(japanDate("2025-13-32")).toBe("");
  });
});

describe("getAges", () => {
  it("経過年数を正しく計算（5年 → 6年目）", () => {
    expect(getAges("2020-11-04")).toBe("5年（6年目）");
  });

  it("未来日は空文字", () => {
    expect(getAges("2030-01-01")).toBe("");
  });

  it("無効な日付は空文字", () => {
    expect(getAges("invalid")).toBe("");
  });
});

describe("getTodayForHeader", () => {
  it("ヘッダー用の日付フォーマットを返す", () => {
    const result = getTodayForHeader();
    // 例: "2025年11月4日（月） 令和7年"
    expect(result).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    expect(result).toMatch(/令和\d+年/);
  });
});
```

#### 1.6.3 Zodスキーマ

**`__tests__/lib/schemas/collection.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { collectionSchema } from "@/lib/schemas/collection";

describe("collectionSchema", () => {
  it("有効なデータを通す", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      description: "家族の記念日",
      isVisible: "1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isVisible).toBe(1); // 型変換確認
    }
  });

  it("名前が空の場合、エラー", () => {
    const result = collectionSchema.safeParse({
      name: "",
      isVisible: "1",
    });

    expect(result.success).toBe(false);
  });

  it("descriptionは任意", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      isVisible: "1",
    });

    expect(result.success).toBe(true);
  });
});
```

**`__tests__/lib/schemas/anniversary.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { anniversarySchema } from "@/lib/schemas/anniversary";

describe("anniversarySchema", () => {
  it("有効な日付を通す", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
  });

  it("無効な日付形式はエラー", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-13-32", // 無効な月日
      collectionId: 1,
    });

    expect(result.success).toBe(false);
  });

  it("日付が空の場合、エラー", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "",
      collectionId: 1,
    });

    expect(result.success).toBe(false);
  });

  it("descriptionは任意", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
  });
});
```

### ✅ Phase 1 実装完了（2025-11-04）

**実装内容**:
- ✅ 依存関係インストール完了
  - Vitest 4.0.6, React Testing Library 16.3.0, Playwright 1.56.1, better-sqlite3 12.4.1
- ✅ 設定ファイル作成完了
  - `vitest.config.ts`, `__tests__/setup.ts`, `playwright.config.ts`
- ✅ package.json スクリプト追加
  - `test`, `test:ui`, `test:coverage`, `test:e2e`, `test:e2e:ui`
- ✅ Unit Tests実装完了（55テスト）
  - `dateCalculation.test.ts` - 14テスト
  - `japanDate.test.ts` - 14テスト
  - `collection.test.ts` - 12テスト
  - `anniversary.test.ts` - 15テスト

**テスト結果**:
```
Test Files  4 passed (4)
Tests      55 passed (55)
Duration   ~300ms
```

**カバレッジ結果**:
```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|----------
All files          |   98.36 |    97.29 |     100 |     100
schemas/           |     100 |      100 |     100 |     100
utils/             |   98.11 |    97.29 |     100 |     100
  dateCalculation  |     100 |      100 |     100 |     100
  japanDate        |   96.55 |    94.11 |     100 |     100
```

**品質チェック**:
- ✅ 全テスト通過
- ✅ Biome lint通過
- ✅ カバレッジ目標達成（utils 90%+, schemas 85%+）
- ✅ テストの独立性確保（beforeEach/afterEach使用）
- ✅ AAA（Arrange-Act-Assert）パターン遵守
- ✅ 境界値テスト実装済み
- ✅ 「テストのためのテスト」を改善（createSchema系のテストを実際の機能テストに変更）

**注意点**:
- 日付テストは`vi.useFakeTimers()`で時間を固定（2025-11-04）
- Zodエラーメッセージは`error.issues`構造に依存（UIで表示するため）
- `japanDate.ts` Line 42（明治より前の日付）は未カバー（想定外のケース）

---

## Phase 2: Integration Tests - Server Actions + MySQL（2-3日）

### 2.1 MySQL テスト環境構築

#### 2.1.1 環境変数設定

**.env.local に追加**

```env
# Test Database (Integration Tests用)
TEST_DATABASE_URL="mysql://ra8_user:ZmvXXXX@127.0.0.1:3306/ra9_test"
```

#### 2.1.2 DB接続の環境切り替え

**`lib/db/index.ts`（修正）**

```typescript
const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    `${process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL"} is not set`
  );
}

export const connection = await mysql.createConnection(connectionString);
export const db = drizzle(connection, { schema, mode: "default" });
```

#### 2.1.3 globalSetup でマイグレーション

**`__tests__/globalSetup.ts`**

```typescript
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

export default async function globalSetup() {
  config({ path: ".env.local" });
  console.log("🔧 Setting up test database...");

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not set");
  }

  let connection;
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
    throw error;
  }

  await connection.end();
}
```

### 2.2 テストヘルパー

**`__tests__/helpers/db.ts`**

```typescript
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";

export async function cleanupTestDb() {
  // 外部キー制約を一時無効化してTRUNCATE
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  await db.execute(sql`TRUNCATE TABLE anniversaries`);
  await db.execute(sql`TRUNCATE TABLE collections`);
  await db.execute(sql`TRUNCATE TABLE users`);
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

export async function createTestUser(
  id: string = "test-user-id",
  email: string = "test@example.com",
  name: string = "Test User",
) {
  await db.insert(users).values({
    id,
    email,
    name,
  });
}
```

### 2.3 モック設定

**`__tests__/setup.ts`（追加）**

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { config } from "dotenv";
import { afterEach, vi } from "vitest";

config({ path: ".env.local" });

// Next.jsのrevalidatePathとredirectをモック
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

afterEach(() => {
  cleanup();
});
```

### 2.4 Vitest設定

**`vitest.config.ts`（追加）**

```typescript
globalSetup: ["./__tests__/globalSetup.ts"],
setupFiles: ["./__tests__/setup.ts"],
env: {
  NODE_ENV: "test",
},
fileParallelism: false, // Integration Testsを直列実行（DB競合回避）
```

### 2.5 Integration Tests実装

**`__tests__/app/actions/collections.integration.test.ts`**

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupTestDb, createTestUser } from "@/__tests__/helpers/db";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollections,
} from "@/app/actions/collections";
import { db } from "@/lib/db/index";
import { anniversaries, collections } from "@/lib/db/schema";

// 認証モック（test-user-idを返す）
vi.mock("@/lib/auth-helpers", () => ({
  getUserId: vi.fn(async () => "test-user-id"),
  requireAuth: vi.fn(async () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  getSession: vi.fn(async () => ({
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  verifyUserAccess: vi.fn(async () => {
    // テスト環境では常に成功
  }),
}));

describe("Collections Integration Tests", () => {
  afterEach(async () => {
    await cleanupTestDb();
  });

  describe("createCollection", () => {
    it("有効なデータでCollection作成成功", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "家族");
      formData.append("description", "家族の記念日");
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      expect(result?.error).toBeUndefined();
      expect(result?.errors).toBeUndefined();

      // DBから直接確認
      const dbCollections = await db.query.collections.findMany();
      expect(dbCollections).toHaveLength(1);
      expect(dbCollections[0].name).toBe("家族");
    });

    it("バリデーションエラー: 名前が空", async () => {
      await createTestUser();

      const formData = new FormData();
      formData.append("name", "");
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      expect(result?.errors?.name).toBeTruthy();

      // DBには保存されていない
      const dbCollections = await db.query.collections.findMany();
      expect(dbCollections).toHaveLength(0);
    });
  });

  // ... 他のテストケース（14テスト）
});
```

**`__tests__/app/actions/anniversaries.integration.test.ts`**

```typescript
// 同様に10テスト実装
```

**`__tests__/app/actions/profile.integration.test.ts`**

```typescript
// 同様に3テスト実装
```

### ✅ Phase 2 実装完了（2025-11-05）

**実装内容**:
- ✅ MySQL テストDB環境構築（TEST_DATABASE_URL）
- ✅ globalSetup.ts でマイグレーション自動実行
- ✅ テストヘルパー実装（cleanupTestDb, createTestUser）
- ✅ 認証モック実装（verifyUserAccess含む）
- ✅ Integration Tests実装完了（27テスト）
  - `collections.integration.test.ts` - 14テスト
  - `anniversaries.integration.test.ts` - 10テスト
  - `profile.integration.test.ts` - 3テスト

**テスト結果**:
```
Test Files  3 passed (3)
Tests      27 passed (27)
Duration   ~1.5s
```

**設計判断**:
- **fileParallelism: false**: DB競合回避のため直列実行（パフォーマンスより正確性優先）
- **TRUNCATE戦略**: `SET FOREIGN_KEY_CHECKS = 0` で外部キー制約を一時無効化し、高速クリーンアップ
- **globalSetup**: 全テスト実行前に1回だけマイグレーション実行（効率的）

**データベース変更**:
- `isVisible` default値: 0 → 1（直感的に）
- `anniversaries` 外部キー: `onDelete: "cascade"` → `onDelete: "restrict"`（データ保護）
- `VISIBILITY` 定数: `VISIBLE: 0, HIDDEN: 1` → `VISIBLE: 1, HIDDEN: 0`（命名と一致）

**認証・エラーハンドリング改善**:
- `lib/auth-helpers.ts`: `verifyUserAccess`統合（多層防御）
- `lib/db/queries.ts`: エラーハンドリング追加（存在確認、明示的エラー）
- `app/actions/*.ts`: エラーメッセージ改善（ユーザーフレンドリー）

**品質チェック**:
- ✅ 全テスト通過（27/27）
- ✅ AAA（Arrange-Act-Assert）パターン遵守
- ✅ テストの独立性確保（afterEach cleanupTestDb）
- ✅ 境界値テスト実装済み（正常系・異常系・エッジケース）
- ✅ 認証・権限分離テスト実装済み

**注意点**:
- テストDB（ra9_test）は開発者が手動で作成する必要あり
- TEST_DATABASE_URLを.env.localに設定必須
- マイグレーション失敗時はテスト全体が失敗（try-catch追加済み）

---

## Phase 3: Component Tests（1-2日）

### 3.1 カスタムRenderヘルパー

**`__tests__/helpers/render.tsx`**

```typescript
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// 必要に応じてProviderを追加
export function customRender(ui: ReactElement) {
  return render(ui);
}

export * from "@testing-library/react";
export { customRender as render };
```

### 3.2 Component Tests実装

**`__tests__/components/forms/CollectionForm.test.tsx`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/__tests__/helpers/render";
import userEvent from "@testing-library/user-event";
import { CollectionForm } from "@/components/forms/CollectionForm";

describe("CollectionForm", () => {
  it("フォームが正しくレンダリング", () => {
    render(<CollectionForm action={vi.fn()} />);

    expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /作成/i })).toBeInTheDocument();
  });

  it("バリデーションエラーを表示", async () => {
    const mockAction = vi.fn(async () => ({
      success: false,
      errors: { name: ["名前は必須です"] },
    }));

    render(<CollectionForm action={mockAction} />);

    const submitButton = screen.getByRole("button", { name: /作成/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("名前は必須です")).toBeInTheDocument();
    });
  });

  it("Pending状態でボタンがdisable", async () => {
    const mockAction = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<CollectionForm action={mockAction} />);

    const submitButton = screen.getByRole("button", { name: /作成/i });
    await userEvent.click(submitButton);

    // Pending中
    expect(submitButton).toBeDisabled();
  });
});
```

**`__tests__/components/AnniversaryCard.test.tsx`**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import { AnniversaryCard } from "@/components/AnniversaryCard";

describe("AnniversaryCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("カウントダウンを正しく表示", () => {
    const anniversary = {
      id: 1,
      name: "誕生日",
      anniversaryDate: "2025-11-10", // 6日後
      description: null,
    };

    render(
      <AnniversaryCard anniversary={anniversary} isEditMode={false} />
    );

    expect(screen.getByText("あと6日")).toBeInTheDocument();
  });

  it("和暦を正しく表示", () => {
    const anniversary = {
      id: 1,
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      description: null,
    };

    render(
      <AnniversaryCard anniversary={anniversary} isEditMode={false} />
    );

    expect(screen.getByText(/令和2年/)).toBeInTheDocument();
  });

  it("編集モードでボタンを表示", () => {
    const anniversary = {
      id: 1,
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      description: null,
    };

    render(
      <AnniversaryCard anniversary={anniversary} isEditMode={true} />
    );

    expect(screen.getByRole("button", { name: /削除/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /編集/i })).toBeInTheDocument();
  });
});
```

---

## Phase 4: E2E Tests - Playwright（2-3日）

### 4.1 E2E環境構築

#### 4.1.1 Playwrightインストール

```bash
npx playwright install
```

#### 4.1.2 認証戦略: Setup Projects + Storage State

**重要**: Auth.js v5 (Database strategy) では、Cookie認証の完全な実装が必要です。単純なCookie追加では動作しません。

**アーキテクチャ**:
1. **Setup Project**: テスト実行前に1回だけ認証セッションを作成
2. **Storage State**: 認証済みブラウザ状態をJSON保存
3. **テスト**: 保存したStorage Stateを再利用

**`playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // E2Eテストは順次実行（DB競合回避）
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // シーケンシャル実行
  reporter: "list",
  globalSetup: require.resolve("./e2e/helpers/global-setup.ts"),
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    // Setup: 認証を1回だけ実行
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Tests: 認証済み状態を再利用
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json", // 認証状態を読み込み
      },
      dependencies: ["setup"], // setupプロジェクトが先に実行
    },
  ],

  webServer: {
    command: "E2E_TEST=true npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false, // 常に新規起動してauth.tsの変更を反映
    env: {
      E2E_TEST: "true",
      AUTH_URL: "http://localhost:3000",
    },
  },
});
```

#### 4.1.3 認証セットアップ

**`e2e/auth.setup.ts`**

```typescript
import { test as setup } from "@playwright/test";
import { getTestDb } from "./helpers/db-seed";
import * as schema from "@/lib/db/schema";
import crypto from "node:crypto";

const authFile = "e2e/.auth/user.json";

/**
 * Setup Project: 認証状態を作成
 * Database strategyに対応した直接セッション作成方式
 */
setup("authenticate", async ({ browser }) => {
  console.log("🔐 Authenticating E2E user...");

  // セッショントークン生成
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日後

  // テストDBに直接セッションを作成
  const db = await getTestDb();
  await db.insert(schema.sessions).values({
    userId: "e2e-user-id",
    sessionToken,
    expires,
  });

  console.log(`✅ Session created: ${sessionToken}`);

  // ブラウザコンテキストを作成
  const context = await browser.newContext();

  // Cookieをブラウザに追加（重要: ブラウザコンテキストに追加）
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      expires: expires.getTime() / 1000,
      httpOnly: true, // Auth.js必須属性
      secure: false, // HTTPなのでfalse
      sameSite: "Lax",
    },
  ]);

  console.log("🍪 Cookie added to browser context");

  // 認証が有効か確認（ページを開いてテスト）
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");

  // リダイレクトされていないか確認
  const currentUrl = page.url();
  if (currentUrl.includes("/auth/signin")) {
    throw new Error(`❌ Authentication failed: redirected to ${currentUrl}`);
  }

  console.log(`✅ Authentication verified: ${currentUrl}`);

  // ブラウザの状態をStorage Stateとして保存
  await context.storageState({ path: authFile });

  console.log(`✅ Storage state saved to ${authFile}`);
  console.log(`🍪 Cookie: ${sessionToken.substring(0, 30)}...`);

  await context.close();
});
```

#### 4.1.4 テストDB操作ヘルパー

**`e2e/helpers/db-seed.ts`**

```typescript
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

let testDb: ReturnType<typeof drizzle> | null = null;
let connection: mysql.Connection | null = null;

export async function getTestDb() {
  if (!testDb) {
    const connectionString = process.env.TEST_DATABASE_URL;
    if (!connectionString) {
      throw new Error("TEST_DATABASE_URL is not set");
    }
    connection = await mysql.createConnection(connectionString);
    testDb = drizzle(connection, { schema, mode: "default" });
  }
  return testDb;
}

export async function closeTestDb() {
  if (connection) {
    await connection.end();
    testDb = null;
    connection = null;
  }
}

export async function cleanupE2EData() {
  const db = await getTestDb();

  // CASCADE削除により、anniversariesも自動削除される
  await db
    .delete(schema.collections)
    .where(eq(schema.collections.userId, "e2e-user-id"));

  console.log("🧹 E2E data cleaned up");
}

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
```

**`e2e/helpers/global-setup.ts`**

```typescript
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { cleanupE2EData, closeTestDb, seedE2EUser } from "./db-seed";

export default async function globalSetup() {
  config({ path: ".env.local" });
  console.log("🔧 Setting up E2E test environment...");

  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is not set in .env.local");
  }

  let connection: mysql.Connection | null = null;

  try {
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
    await closeTestDb();
  }
}
```

#### 4.1.5 重要: アプリケーション側の修正

**`lib/db/index.ts`（E2E_TEST環境変数対応）**

```typescript
// テスト環境ではTEST_DATABASE_URLを使用
const connectionString =
  process.env.NODE_ENV === "test" || process.env.E2E_TEST === "true" // ← E2E対応
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
```

**⚠️ この修正がないと、Auth.jsが本番DBを参照してセッションが見つからない**

**`auth.ts`（E2E用設定）**

```typescript
export const authConfig = {
  // ...
  debug: true, // E2Eテスト用: セッション検証フローをログ出力
  useSecureCookies: false, // E2Eテスト対応: Cookie名を authjs.session-token に固定
  // ...
} satisfies NextAuthConfig;
```

### 4.2 E2E Tests実装

**`e2e/collection-crud.spec.ts`**

```typescript
import { test, expect } from "./fixtures/auth";

test.describe("Collection CRUD", () => {
  test("Collection作成 → 編集 → 削除のフロー", async ({ page }) => {
    // 編集ページに移動
    await page.goto("/edit");

    // Collection作成ボタンをクリック
    await page.click('a[href*="/edit/collection/new"]');

    // フォーム入力
    await page.fill('input[name="name"]', "テストCollection");
    await page.fill('textarea[name="description"]', "説明文");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページにリダイレクト
    await expect(page).toHaveURL("/edit");

    // 作成したCollectionが表示
    await expect(page.getByText("テストCollection")).toBeVisible();

    // 編集
    await page.click('a[href*="/edit/collection/"]');
    await page.fill('input[name="name"]', "テストCollection（更新）");
    await page.click('button[type="submit"]');

    // 更新確認
    await expect(page.getByText("テストCollection（更新）")).toBeVisible();

    // 削除
    await page.click('button:has-text("削除")');
    await page.click('button:has-text("削除する")'); // 確認ダイアログ

    // 削除確認
    await expect(page.getByText("テストCollection（更新）")).not.toBeVisible();
  });
});
```

**`e2e/anniversary-crud.spec.ts`**

```typescript
import { test, expect } from "./fixtures/auth";

test.describe("Anniversary CRUD", () => {
  test.beforeEach(async ({ page }) => {
    // 事前にCollectionを作成
    await page.goto("/edit/collection/new");
    await page.fill('input[name="name"]', "E2Eテスト用Collection");
    await page.click('button[type="submit"]');
  });

  test("Anniversary作成 → 一覧表示確認", async ({ page }) => {
    await page.goto("/edit");

    // Anniversary追加ボタン
    await page.click('a:has-text("記念日を追加")');

    // フォーム入力
    await page.fill('input[name="name"]', "誕生日");
    await page.fill('input[name="anniversaryDate"]', "2020-11-04");
    await page.fill('textarea[name="description"]', "家族の誕生日");

    // 送信
    await page.click('button[type="submit"]');

    // 編集ページで確認
    await expect(page.getByText("誕生日")).toBeVisible();

    // 一覧ページで確認
    await page.goto("/");
    await expect(page.getByText("誕生日")).toBeVisible();
    await expect(page.getByText(/令和2年/)).toBeVisible(); // 和暦
    await expect(page.getByText(/あと\d+日/)).toBeVisible(); // カウントダウン
  });
});
```

**`e2e/dashboard.spec.ts`**

```typescript
import { test, expect } from "./fixtures/auth";

test.describe("Dashboard", () => {
  test("一覧ページに記念日が表示される", async ({ page }) => {
    // 事前にデータ作成（テストフィクスチャ）
    // ...

    await page.goto("/");

    // Collectionカード表示
    await expect(page.getByText("家族")).toBeVisible();

    // Anniversaryカード表示
    await expect(page.getByText("誕生日")).toBeVisible();

    // カウントダウン表示
    await expect(page.getByText(/あと\d+日/)).toBeVisible();

    // 和暦表示
    await expect(page.getByText(/令和\d+年/)).toBeVisible();
  });

  test("is_visible=0のCollectionは非表示", async ({ page }) => {
    // is_visible=0のCollection作成
    // ...

    await page.goto("/");

    // 非表示Collection確認
    await expect(page.getByText("非表示Collection")).not.toBeVisible();
  });
});
```

### 🚧 Phase 4 実装途中（2025-11-06） - 認証完了・テスト59%通過

**ステータス**: 認証基盤は完全動作、22テスト中13テスト通過（残り9テスト要修正）

**実装内容**:
- ✅ Playwright 1.56.1インストール完了
- ✅ Setup Projects + Storage State認証実装
- ✅ E2Eテストスペック4ファイル・22テスト実装
  - `e2e/dashboard.spec.ts` - 6テスト
  - `e2e/collection-crud.spec.ts` - 6テスト
  - `e2e/anniversary-crud.spec.ts` - 7テスト
  - `e2e/profile.spec.ts` - 3テスト
- ✅ MySQL testDB統合（TEST_DATABASE_URL使用）
- ✅ 認証問題の根本解決（lib/db/index.ts修正）

**テスト結果**:
```
Test Files  1 passed (Setup Project)
           + 22 E2E tests
Tests      13 passed / 9 failed (59%)
Duration   ~1.4分
```

**通過テスト（13件）**:
1. Setup Project - 認証セットアップ ✅
2. Anniversary CRUD:
   - Anniversary作成 → 一覧表示確認 ✅
   - Anniversary編集 → 更新確認 ✅
   - 複数のAnniversaryを同じCollectionに追加 ✅
   - Anniversaryの日付順序確認 ✅
3. Collection CRUD:
   - Collection編集 ✅
   - 複数のCollectionを作成 ✅
4. Dashboard:
   - is_visible=0のCollectionは非表示 ✅
   - 記念日がないCollectionは表示されない ✅
   - 複数のCollectionとAnniversaryが表示される ✅
5. Profile: ユーザー名を空にすると、バリデーションエラー ✅

**失敗テスト（9件）**:
1. **isVisibleラジオボタンが見つからない** (2テスト)
   - CollectionFormに`isVisible`フィールドがない
   - 原因: フォームコンポーネント未実装
2. **バリデーションエラーが表示されない** (3テスト)
   - HTML5バリデーション無効化後もサーバーエラーが表示されない
   - 原因: Server Actionエラーレスポンス構造の問題
3. **削除・CASCADEテスト** (2テスト)
   - セレクターまたは待機条件の問題
4. **Profileテスト** (2テスト)
   - テスト間のデータ汚染（部分的に残存）

**設計判断**:
- **Setup Projects**: 認証を1回だけ実行し、Storage Stateで再利用（効率的）
- **Database strategy対応**: 直接sessionsテーブルにレコード挿入（Auth.js v5対応）
- **context.addCookies()**: ブラウザコンテキストに直接Cookie追加（正しいアプローチ）
- **workers: 1**: シーケンシャル実行でDB競合回避
- **E2E_TEST環境変数**: lib/db/index.tsで認識してTEST_DATABASE_URL使用

**認証問題の解決過程**:
1. **初回試行**: 単純なCookie追加 → 失敗（Auth.jsが認識しない）
2. **調査**: Auth.jsソースコード解析 → useSecureCookies設定が必要
3. **2回目**: useSecureCookies設定 → 失敗（まだ認識しない）
4. **根本原因発見**: lib/db/index.tsがE2E_TEST環境変数を認識せず、Auth.jsが本番DBを参照
5. **最終解決**: lib/db/index.tsに`|| process.env.E2E_TEST === "true"`追加 → 成功 ✅

**アプリケーション改善**:
- `app/(main)/edit/collection/[collectionId]/anniversary/new/page.tsx`: collectionがnullの場合のリダイレクト追加
- `app/(main)/edit/collection/[collectionId]/anniversary/[anniversaryId]/page.tsx`: collection/anniversaryがnullの場合のリダイレクト追加
- エラーハンドリング強化

**実施した修正（2025-11-06）**:
1. ✅ **カウントダウン表示修正**
   - `lib/utils/dateCalculation.ts`: `formatCountdown()`を修正（"あと X"→"X"に変更）
   - `components/AnniversaryCard.tsx`: `countdown.value`と`countdown.unit`を使用
   - `__tests__/lib/utils/dateCalculation.test.ts`: Unit Test更新
2. ✅ **Strict mode violation修正**
   - 全テストファイルで`.first()`追加（複数要素マッチ対策）
   - e2e/dashboard.spec.ts, e2e/collection-crud.spec.ts, e2e/anniversary-crud.spec.ts
3. ✅ **バリデーションエラーテスト修正**
   - HTML5バリデーション無効化（`form.setAttribute("novalidate", "")`）
   - 無効な日付入力テスト修正（`input.type = "text"`に変更）
4. ✅ **削除機能の待機条件改善**
   - `page.waitForLoadState("networkidle")`追加
   - `.first()`でセレクター特定
5. ✅ **Profileテストのデータ汚染対策**
   - beforeEach相当でユーザー名リセット
6. ✅ **編集リンクセレクター修正**
   - ヘッダーの"編集"リンクとカード内編集リンクを区別

**品質チェック**:
- ✅ Setup Project認証: 完全動作
- ✅ DB接続: テストDB使用（E2E_TEST環境変数）
- ✅ テスト通過率: 59%（13/22）← 前回45%から改善
- ⚠️ 残課題: CollectionFormのisVisibleフィールド、バリデーションエラー表示

**注意点**:
- **重要**: lib/db/index.tsのE2E_TEST対応が必須（ないと認証が動作しない）
- テストはシーケンシャル実行（workers: 1）
- Storage State JSON: e2e/.auth/user.json（.gitignore済み）
- セッションはafterEachでクリーンアップしない（Setup Projectセッションを保持）

**残課題（次のセッションで対応）**:
1. **CollectionFormにisVisibleフィールドを追加** (2テスト失敗)
   - `components/forms/CollectionForm.tsx`にラジオボタン追加
   - デフォルト値: `isVisible=1`（表示）
2. **バリデーションエラー表示の修正** (3テスト失敗)
   - Server Actionのエラーレスポンス構造確認
   - `state?.errors?.fieldName`が正しく表示されるか検証
3. **削除・CASCADEテストの修正** (2テスト失敗)
   - セレクターと待機条件の再確認
4. **Profileテストのデータ汚染完全解決** (2テスト失敗)
   - テスト順序の影響を完全に排除

**🎯 次のセッションで最初にやること**:

```bash
# ブランチ確認
git branch  # → feature/e2e

# テスト状況確認
npm run test:e2e  # → 13/22 passed (59%)

# 優先対応：CollectionFormにisVisibleフィールド追加
# components/forms/CollectionForm.tsx を編集
```

**修正すべき9テスト**:
1. **CollectionForm isVisibleフィールド** (2テスト) - フォームコンポーネント修正
2. **バリデーションエラー表示** (3テスト) - Server Actionレスポンス確認
3. **削除・CASCADE** (2テスト) - セレクター・待機条件
4. **Profile** (2テスト) - データ汚染対策強化

**推奨アプローチ**:
1. CollectionFormに`isVisible`ラジオボタンを追加（最優先）
2. 単独テスト実行で問題特定: `npx playwright test e2e/collection-crud.spec.ts:11 --headed`
3. ブラウザでスクリーンショット確認: `await page.screenshot({ path: "debug.png" })`
4. 全テスト実行: `npm run test:e2e`

**重要**:
- 認証基盤は完全動作（触らない）
- カウントダウン表示・Strict mode violationは修正済み

---

## 実装チェックリスト

### Phase 1: セットアップ + Unit Tests
- [x] 依存関係インストール（Vitest、React Testing Library、Playwright、better-sqlite3）
- [x] `vitest.config.ts` 作成
- [x] `__tests__/setup.ts` 作成
- [x] `playwright.config.ts` 作成
- [x] `package.json` スクリプト追加
- [x] `__tests__/lib/utils/dateCalculation.test.ts` 実装（14テスト）
- [x] `__tests__/lib/utils/japanDate.test.ts` 実装（14テスト）
- [x] `__tests__/lib/schemas/collection.test.ts` 実装（12テスト）
- [x] `__tests__/lib/schemas/anniversary.test.ts` 実装（15テスト）
- [x] Phase 1テスト実行: `npm test` → 55/55 passed ✅

### Phase 2: Integration Tests
- [x] TEST_DATABASE_URL 環境変数設定（.env.local）
- [x] `lib/db/index.ts` 環境切り替え実装
- [x] `__tests__/globalSetup.ts` 作成（マイグレーション自動実行）
- [x] `__tests__/helpers/db.ts` 作成（cleanupTestDb, createTestUser）
- [x] `__tests__/setup.ts` 修正（dotenv, Next.jsモック）
- [x] vitest.config.ts 更新（globalSetup, NODE_ENV, fileParallelism）
- [x] `__tests__/app/actions/collections.integration.test.ts` 実装（14テスト）
- [x] `__tests__/app/actions/anniversaries.integration.test.ts` 実装（10テスト）
- [x] `__tests__/app/actions/profile.integration.test.ts` 実装（3テスト）
- [x] 認証モック実装（verifyUserAccess含む）
- [x] Phase 2テスト実行: `npm run test:integration` → 27/27 passed ✅

### Phase 3: Component Tests
- [ ] `__tests__/helpers/render.tsx` 作成
- [ ] `__tests__/components/forms/CollectionForm.test.tsx` 実装
- [ ] `__tests__/components/forms/AnniversaryForm.test.tsx` 実装
- [ ] `__tests__/components/CollectionCard.test.tsx` 実装
- [ ] `__tests__/components/AnniversaryCard.test.tsx` 実装
- [ ] `__tests__/components/ui/Button.test.tsx` 実装
- [ ] Phase 3テスト実行: `npm test`

### Phase 4: E2E Tests
- [x] Playwrightインストール: `npx playwright install`
- [x] Setup Projects + Storage State認証実装
- [x] `e2e/auth.setup.ts` 作成（Database strategy対応）
- [x] `e2e/helpers/db-seed.ts` 作成（テストDB操作）
- [x] `e2e/helpers/global-setup.ts` 作成（マイグレーション）
- [x] `e2e/fixtures/test-data.ts` 作成（テストデータヘルパー）
- [x] `e2e/collection-crud.spec.ts` 実装（6テスト）
- [x] `e2e/anniversary-crud.spec.ts` 実装（7テスト）
- [x] `e2e/dashboard.spec.ts` 実装（6テスト）
- [x] `e2e/profile.spec.ts` 実装（3テスト）
- [x] `lib/db/index.ts` E2E_TEST環境変数対応（重要）
- [x] `auth.ts` debug/useSecureCookies設定
- [x] Anniversary編集/作成ページ nullチェック追加
- [x] Phase 4テスト実行: `npm run test:e2e` → 10/22 passed (45%) ⚠️

### カバレッジ確認
- [ ] カバレッジレポート生成: `npm run test:coverage`
- [ ] utils/ カバレッジ 90%+ 確認
- [ ] schemas/ カバレッジ 85%+ 確認
- [ ] actions/ カバレッジ 80%+ 確認

---

## トラブルシューティング

### Vitest関連

#### 問題: `Cannot find module '@/...'`
**解決**: `vitest.config.ts` の `resolve.alias` を確認

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "."),
  },
},
```

#### 問題: `ReferenceError: document is not defined`
**解決**: `test.environment` を `happy-dom` に変更

```typescript
test: {
  environment: "happy-dom",
},
```

### SQLite関連

#### 問題: `better-sqlite3` インストールエラー
**解決**: ネイティブモジュールのビルドが必要

```bash
npm install -D better-sqlite3 --build-from-source
```

または

```bash
npm install -D better-sqlite3 --force
```

#### 問題: マイグレーションが失敗
**解決**: Drizzleスキーマの型をSQLite互換に調整

- `mysql().autoincrement()` → `integer().primaryKey({ autoIncrement: true })`
- `timestamp()` → `integer()` (UNIX timestamp)

### Playwright関連

#### 問題: E2Eテストがタイムアウト
**解決**: `playwright.config.ts` でタイムアウト延長

```typescript
use: {
  actionTimeout: 10000, // 10秒
},
```

#### 問題: Auth.js v5 (Database strategy) で認証が動作しない
**症状**: Storage State JSONは作成されるが、テストで`/auth/signin`にリダイレクトされる

**調査過程**:
1. Cookieは正しく送信されている（確認済み）
2. セッションはDBに存在する（確認済み）
3. しかしAuth.jsがセッションを認識しない

**根本原因**: `lib/db/index.ts`がE2E_TEST環境変数を認識せず、Auth.jsが本番DBを参照していた

**解決**:
```typescript
// lib/db/index.ts
const connectionString =
  process.env.NODE_ENV === "test" || process.env.E2E_TEST === "true" // ← 追加
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
```

**追加設定**:
```typescript
// auth.ts
export const authConfig = {
  debug: true, // E2Eテスト用: セッション検証フローをログ出力
  useSecureCookies: false, // Cookie名を authjs.session-token に固定
  // ...
};
```

**検証方法**:
- Setup Projectのauth.setup.tsで`page.goto("/")`して、URLが`/auth/signin`でないことを確認
- Auth.jsのdebugログでセッション検証フローを確認

#### 問題: Storage State Cookieが実際のHTTPリクエストで送信されない
**症状**: Storage State JSONにCookieがあるのに、ブラウザがCookieを送信しない

**原因**: `fs.writeFileSync()`で手動作成したJSONは、ブラウザコンテキストにCookieを追加しない

**誤ったアプローチ**:
```typescript
// ❌ これは動作しない
const storageState = { cookies: [...] };
fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
```

**正しいアプローチ**:
```typescript
// ✅ ブラウザコンテキストにCookieを追加してから保存
const context = await browser.newContext();
await context.addCookies([...]); // ブラウザに追加
await context.storageState({ path: authFile }); // ブラウザ状態を保存
```

#### 問題: 並列実行でテストが失敗する
**症状**: 単独実行では成功するが、並列実行で失敗

**原因**: DB競合（複数テストが同時にE2Eユーザーのデータを操作）

**解決**:
```typescript
// playwright.config.ts
fullyParallel: false,
workers: 1, // シーケンシャル実行
```

---

## 参考リソース

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/
- **Drizzle ORM**: https://orm.drizzle.team/
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3

---

## 次のステップ

1. **Phase 1から開始**: `npm test` でUnit Testsを実行
2. **段階的に実装**: 各Phaseのチェックリストを確認
3. **カバレッジ確認**: `npm run test:coverage` で目標達成を確認
4. **CI/CD統合**: GitHub Actionsでテスト自動実行（次の課題）

---

このドキュメントは随時更新してください。テスト実装中に発見した問題や解決策を追記することで、他のClaudeセッションでもスムーズに作業できます。
