# Recording Anniversaries 9 - テスト実装戦略

このドキュメントは、プロジェクトの包括的なテスト実装戦略を定義します。他のClaudeセッションでも迷わず実装できるよう、詳細な手順とコード例を含んでいます。

## 📋 概要

- **範囲**: 全Phase（Unit → Integration → Component → E2E）
- **期間**: 6-10日
- **DB戦略**: SQLite（`:memory:`）でテスト専用環境
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

## Phase 2: Integration Tests - Server Actions + SQLite（2-3日）

### 2.1 SQLite テスト環境構築

#### 2.1.1 テスト用DB接続

**`lib/db/test-db.ts`**

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// `:memory:` でインメモリDB（高速、テスト間分離）
export function createTestDb() {
  const sqlite = new Database(":memory:");
  return drizzle(sqlite, { schema });
}

// テスト用マイグレーション実行
export async function setupTestDb(db: ReturnType<typeof createTestDb>) {
  // Drizzleスキーマから自動でテーブル作成
  // または migrations/ からSQLを実行

  // 簡易版: 必要なテーブルを手動作成
  db.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER,
      image TEXT,
      google_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  db.run(`
    CREATE TABLE collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_visible INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE anniversaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      anniversary_date TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
  `);

  // Auth.js用テーブル（必要に応じて）
  // ...
}
```

### 2.2 モック化ヘルパー

**`__tests__/mocks/auth.ts`**

```typescript
import { vi } from "vitest";

export const mockUserId = "test-user-id";

export function mockGetUserId() {
  vi.mock("@/lib/auth-helpers", () => ({
    getUserId: vi.fn(async () => mockUserId),
    requireAuth: vi.fn(async () => ({
      user: { id: mockUserId, email: "test@example.com" },
    })),
  }));
}
```

**`__tests__/mocks/nextjs.ts`**

```typescript
import { vi } from "vitest";

export function mockNextjsServerFunctions() {
  vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
  }));

  vi.mock("next/navigation", () => ({
    redirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT: ${path}`);
    }),
  }));
}
```

### 2.3 テストヘルパー

**`__tests__/helpers/test-context.ts`**

```typescript
import { createTestDb, setupTestDb } from "@/lib/db/test-db";

export async function createTestContext() {
  const db = createTestDb();
  await setupTestDb(db);

  // テストユーザー作成
  await db.insert(schema.users).values({
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
  });

  return { db };
}
```

### 2.4 Integration Tests実装

**`__tests__/app/actions/collections.test.ts`**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestContext } from "@/__tests__/helpers/test-context";
import { mockGetUserId, mockNextjsServerFunctions } from "@/__tests__/mocks";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollections,
} from "@/app/actions/collections";

// モック化
mockGetUserId();
mockNextjsServerFunctions();

describe("Collections Server Actions", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    const context = await createTestContext();
    db = context.db;
  });

  describe("createCollection", () => {
    it("有効なデータでCollection作成成功", async () => {
      const formData = new FormData();
      formData.append("name", "家族");
      formData.append("description", "家族の記念日");
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      expect(result.success).toBe(true);
      expect(result.message).toBeTruthy();
    });

    it("名前が空の場合、バリデーションエラー", async () => {
      const formData = new FormData();
      formData.append("name", "");
      formData.append("isVisible", "1");

      const result = await createCollection(null, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.name).toBeTruthy();
    });
  });

  describe("updateCollection", () => {
    it("所有者がCollection更新成功", async () => {
      // 事前にCollection作成
      const collection = await db.insert(schema.collections).values({
        userId: "test-user-id",
        name: "家族",
      }).returning();

      const formData = new FormData();
      formData.append("collectionId", collection[0].id.toString());
      formData.append("name", "家族（更新）");

      const result = await updateCollection(null, formData);

      expect(result.success).toBe(true);
    });

    it("他ユーザーのCollectionは更新不可", async () => {
      // 他ユーザーのCollection作成
      const collection = await db.insert(schema.collections).values({
        userId: "other-user-id",
        name: "他ユーザー",
      }).returning();

      const formData = new FormData();
      formData.append("collectionId", collection[0].id.toString());
      formData.append("name", "更新試行");

      const result = await updateCollection(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("権限");
    });
  });

  describe("deleteCollection", () => {
    it("記念日がないCollectionは削除成功", async () => {
      const collection = await db.insert(schema.collections).values({
        userId: "test-user-id",
        name: "削除対象",
      }).returning();

      const formData = new FormData();
      formData.append("collectionId", collection[0].id.toString());

      const result = await deleteCollection(null, formData);

      expect(result.success).toBe(true);
    });

    it("記念日があるCollectionは外部キー制約エラー", async () => {
      // Collection + Anniversary作成
      const collection = await db.insert(schema.collections).values({
        userId: "test-user-id",
        name: "家族",
      }).returning();

      await db.insert(schema.anniversaries).values({
        collectionId: collection[0].id,
        name: "誕生日",
        anniversaryDate: "2020-11-04",
      });

      const formData = new FormData();
      formData.append("collectionId", collection[0].id.toString());

      const result = await deleteCollection(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("記念日");
    });
  });

  describe("getCollections", () => {
    it("ユーザーごとにデータ分離", async () => {
      // 自分のCollection
      await db.insert(schema.collections).values({
        userId: "test-user-id",
        name: "自分のCollection",
      });

      // 他ユーザーのCollection
      await db.insert(schema.collections).values({
        userId: "other-user-id",
        name: "他ユーザーのCollection",
      });

      const collections = await getCollections();

      expect(collections).toHaveLength(1);
      expect(collections[0].name).toBe("自分のCollection");
    });
  });
});
```

**`__tests__/app/actions/anniversaries.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createTestContext } from "@/__tests__/helpers/test-context";
import { mockGetUserId, mockNextjsServerFunctions } from "@/__tests__/mocks";
import {
  createAnniversary,
  updateAnniversary,
  deleteAnniversary,
} from "@/app/actions/anniversaries";

mockGetUserId();
mockNextjsServerFunctions();

describe("Anniversaries Server Actions", () => {
  let db: ReturnType<typeof createTestDb>;
  let collectionId: number;

  beforeEach(async () => {
    const context = await createTestContext();
    db = context.db;

    // テスト用Collection作成
    const collection = await db.insert(schema.collections).values({
      userId: "test-user-id",
      name: "家族",
    }).returning();

    collectionId = collection[0].id;
  });

  describe("createAnniversary", () => {
    it("有効なデータでAnniversary作成成功", async () => {
      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-11-04");
      formData.append("collectionId", collectionId.toString());

      const result = await createAnniversary(null, formData);

      expect(result.success).toBe(true);
    });

    it("無効な日付形式はバリデーションエラー", async () => {
      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-13-32");
      formData.append("collectionId", collectionId.toString());

      const result = await createAnniversary(null, formData);

      expect(result.success).toBe(false);
      expect(result.errors?.anniversaryDate).toBeTruthy();
    });

    it("他ユーザーのCollectionには作成不可", async () => {
      // 他ユーザーのCollection
      const otherCollection = await db.insert(schema.collections).values({
        userId: "other-user-id",
        name: "他ユーザー",
      }).returning();

      const formData = new FormData();
      formData.append("name", "誕生日");
      formData.append("anniversaryDate", "2020-11-04");
      formData.append("collectionId", otherCollection[0].id.toString());

      const result = await createAnniversary(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("権限");
    });
  });
});
```

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

#### 4.1.2 認証モック（Auth.js bypass）

**`e2e/fixtures/auth.ts`**

```typescript
import { test as base } from "@playwright/test";

export const test = base.extend({
  // 認証済みセッションを自動セット
  context: async ({ context }, use) => {
    // Auth.jsセッションCookieをモック
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "test-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await use(context);
  },
});

export { expect } from "@playwright/test";
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

---

## 実装チェックリスト

### Phase 1: セットアップ + Unit Tests
- [ ] 依存関係インストール（Vitest、React Testing Library、Playwright、better-sqlite3）
- [ ] `vitest.config.ts` 作成
- [ ] `__tests__/setup.ts` 作成
- [ ] `playwright.config.ts` 作成
- [ ] `package.json` スクリプト追加
- [ ] `__tests__/lib/utils/dateCalculation.test.ts` 実装
- [ ] `__tests__/lib/utils/japanDate.test.ts` 実装
- [ ] `__tests__/lib/schemas/collection.test.ts` 実装
- [ ] `__tests__/lib/schemas/anniversary.test.ts` 実装
- [ ] Phase 1テスト実行: `npm test`

### Phase 2: Integration Tests
- [ ] `lib/db/test-db.ts` 作成（SQLite接続）
- [ ] `__tests__/mocks/auth.ts` 作成
- [ ] `__tests__/mocks/nextjs.ts` 作成
- [ ] `__tests__/helpers/test-context.ts` 作成
- [ ] `__tests__/app/actions/collections.test.ts` 実装
- [ ] `__tests__/app/actions/anniversaries.test.ts` 実装
- [ ] `__tests__/app/actions/profile.test.ts` 実装
- [ ] Phase 2テスト実行: `npm test`

### Phase 3: Component Tests
- [ ] `__tests__/helpers/render.tsx` 作成
- [ ] `__tests__/components/forms/CollectionForm.test.tsx` 実装
- [ ] `__tests__/components/forms/AnniversaryForm.test.tsx` 実装
- [ ] `__tests__/components/CollectionCard.test.tsx` 実装
- [ ] `__tests__/components/AnniversaryCard.test.tsx` 実装
- [ ] `__tests__/components/ui/Button.test.tsx` 実装
- [ ] Phase 3テスト実行: `npm test`

### Phase 4: E2E Tests
- [ ] Playwrightインストール: `npx playwright install`
- [ ] `e2e/fixtures/auth.ts` 作成（認証モック）
- [ ] `e2e/collection-crud.spec.ts` 実装
- [ ] `e2e/anniversary-crud.spec.ts` 実装
- [ ] `e2e/dashboard.spec.ts` 実装
- [ ] `e2e/profile.spec.ts` 実装
- [ ] Phase 4テスト実行: `npm run test:e2e`

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

#### 問題: 認証が必要なページでリダイレクト
**解決**: `e2e/fixtures/auth.ts` でセッションCookieをモック

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
