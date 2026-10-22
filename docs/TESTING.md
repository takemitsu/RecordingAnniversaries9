# テスト

このドキュメントは、プロジェクトのテスト実行・メンテナンス方法をまとめたものです。

## 📋 テスト構成

**総計: 270テスト全通過 ✅**（Vitest 246 + E2E 24、2026-10-22 時点）

| テストタイプ | テスト数 | 割合 | 目的 |
|------------|---------|------|------|
| **Unit Tests** | 55 | 27.5% | ビジネスロジック（日付計算、和暦変換、Zodバリデーション） |
| **Integration Tests** | 33 | 16.5% | Server Actions + MySQL（CRUD操作、認証、Passkey管理、CASCADE） |
| **Component Tests** | 88 | 44% | UIコンポーネント（フォーム、カード、ボタン、Passkey） |
| **E2E Tests** | 24 | 12% | ユーザーフロー（CRUD、Dashboard、Profile、Passkey UI、Accessibility） |

### Testing Trophy理論準拠

このプロジェクトは**Testing Trophy**理論に準拠しています：

```
       /\
      /  \    E2E (14.9%) ← 理想値: 5-10%、少し超過
     /____\
    /      \  Integration (20.5%) ← 最も重要
   /________\
  /          \ Component (31.7%) ← ユーザー視点
 /____________\
/______________\ Unit (34.2%) ← 基礎
```

**設計思想:**
- **E2Eは最小限**: バリデーションエラーなど下層でカバー済みのテストは除外
- **Integration重視**: Server Actions + MySQL（実環境に近い）
- **Component適度**: ユーザーインタラクション
- **Unit基礎**: ビジネスロジックの正確性保証

## 🚀 テスト実行

### 基本コマンド

```bash
# Unit/Integration/Component テスト（139テスト）
npm test

# E2Eテスト（24テスト）
npm run test:e2e

# 全テスト実行（Vitest 246テスト）
npm test && E2E_TEST=true npm run test:e2e
```

### UIモード（デバッグ用）

```bash
# Vitest UI（ブラウザで結果確認）
npm run test:ui

# Playwright UI Mode（E2Eデバッグ）
npm run test:e2e:ui
```

### カバレッジレポート

```bash
# カバレッジ生成
npm run test:coverage

# ブラウザで確認
open coverage/index.html
```

**カバレッジ目標:**
- `lib/utils/`: 98%+ ✅
- `lib/schemas/`: 100% ✅
- `app/actions/`: 80%+（今後）

### 個別テスト実行

```bash
# 特定ファイルのみ実行
npx vitest __tests__/lib/utils/dateCalculation.test.ts

# E2Eの特定テストのみ実行
npx playwright test e2e/dashboard.spec.ts

# E2Eの特定テストを目視確認（--headed）
npx playwright test e2e/dashboard.spec.ts --headed
```

## 🛠️ テスト環境セットアップ

### 1. テストDB作成（Integration/E2E用）

```sql
CREATE DATABASE ra9_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 環境変数設定

`.env.local` に追加:

```env
TEST_DATABASE_URL="mysql://user:password@127.0.0.1:3306/ra9_test"
```

**重要**: `TEST_DATABASE_URL` は `DATABASE_URL` と同じユーザー名・パスワードでOKですが、**データベース名は必ず別のものを指定**してください（本番データ保護のため）。

### 3. マイグレーション

テスト実行時に自動的にマイグレーションが実行されます（`__tests__/globalSetup.ts`、`e2e/helpers/global-setup.ts`）。

## 📝 テストの詳細

### Unit Tests（55テスト）

**対象ファイル:**
- `__tests__/lib/utils/dateCalculation.test.ts` - 14テスト
- `__tests__/lib/utils/japanDate.test.ts` - 14テスト
- `__tests__/lib/schemas/collection.test.ts` - 12テスト
- `__tests__/lib/schemas/anniversary.test.ts` - 15テスト

**カバー範囲:**
- 記念日まであと何日の計算（年次繰り返し対応）
- 和暦変換（令和、平成など）
- Zodバリデーション（Collection、Anniversary）

### Integration Tests（33テスト）

**対象ファイル:**
- `__tests__/app/actions/collections.integration.test.ts` - 14テスト
- `__tests__/app/actions/anniversaries.integration.test.ts` - 10テスト
- `__tests__/app/actions/profile.integration.test.ts` - 3テスト
- `__tests__/app/actions/authenticators.integration.test.ts` - 6テスト

**カバー範囲:**
- Server Actions CRUD操作
- 認証・権限分離
- Passkey管理（取得/削除）
- CASCADE削除動作
- MySQL特有の挙動（DATE型、外部キー制約）

**設計判断:**
- **MySQL testDB使用**: 本番環境と同じDB（外部キー、DATE型の挙動を正確にテスト）
- **fileParallelism: false**: DB競合回避のため直列実行

### Component Tests（88テスト）

**対象ファイル:**
- `__tests__/components/forms/CollectionForm.test.tsx` - 15テスト
- `__tests__/components/forms/AnniversaryForm.test.tsx` - 15テスト
- `__tests__/components/CollectionCard.test.tsx` - 6テスト
- `__tests__/components/AnniversaryCard.test.tsx` - 6テスト
- `__tests__/components/ui/Button.test.tsx` - 9テスト
- `__tests__/app/(main)/profile/PasskeyManager.test.tsx` - 19テスト
- `__tests__/app/auth/signin/SignInForm.test.tsx` - 18テスト

**カバー範囲:**
- フォームの入力・バリデーション・送信
- カードの表示（記念日まであと何日、和暦）
- ボタンのスタイル・Pending状態
- Passkey認証UI（作成、エラーハンドリング、ログイン）

**React Testing Library使用:**
- ユーザー視点のテスト（実装詳細に依存しない）
- アクセシビリティ重視（`getByRole`, `getByLabelText`）

### E2E Tests（24テスト）

**対象ファイル:**
- `e2e/collection-crud.spec.ts` - 3テスト
- `e2e/anniversary-crud.spec.ts` - 5テスト
- `e2e/dashboard.spec.ts` - 6テスト
- `e2e/profile.spec.ts` - 3テスト
- `e2e/passkey.spec.ts` - 5テスト
- `e2e/accessibility.spec.ts` - 2テスト

**カバー範囲:**
- Collections/Anniversaries CRUD フロー
- Dashboard表示（isVisible制御）
- Profile更新
- Passkey UI表示確認（サインインページ、プロフィールページ）
- アクセシビリティ（キーボードナビゲーション、データ永続性）

**Playwright + Auth.js Database strategy:**
- Setup Projects: 認証を1回だけ実行し、Storage Stateで再利用
- シーケンシャル実行（workers: 1）でDB競合回避

## 🔧 よくあるトラブルシューティング

### 問題: `TEST_DATABASE_URL is not set`

**解決**: `.env.local` に `TEST_DATABASE_URL` を追加してください。

### 問題: テストDB接続エラー

**解決**: 接続情報を確認してください。

```bash
# 接続確認
mysql -h 127.0.0.1 -P 3306 -u user -ppassword ra9_test
```

### 問題: マイグレーションエラー

**解決**: テストDBを作り直してください。

```sql
DROP DATABASE IF EXISTS ra9_test;
CREATE DATABASE ra9_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 問題: E2Eテストで認証エラー（`/auth/signin`にリダイレクト）

**原因**: `lib/db/index.ts`がE2E_TEST環境変数を認識していない。

**解決**: 以下のコードを確認してください（既に実装済み）:

```typescript
// lib/db/index.ts
const connectionString =
  process.env.NODE_ENV === "test" || process.env.E2E_TEST === "true" // ← E2E対応
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;
```

### 問題: E2Eテストが並列実行で失敗する

**原因**: DB競合（複数テストが同時にE2Eユーザーのデータを操作）

**解決**: `playwright.config.ts`で`workers: 1`を確認してください（既に設定済み）。

### 問題: Component Testで`Cannot find module '@/...'`

**解決**: `vitest.config.ts` の `resolve.alias` を確認してください（既に設定済み）:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "."),
  },
},
```

### 問題: カバレッジが低い

**確認ポイント:**
1. テストファイルが正しく実行されているか（`npm run test:ui`で確認）
2. テスト対象ファイルが`coverage.exclude`に含まれていないか（`vitest.config.ts`）
3. テストケースが実際にコードを通過しているか（ブランチカバレッジ）

## 📚 参考リソース

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/
- **Testing Trophy**: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications

---

## 🗂️ 詳細な実装記録

Phase 1-4の詳細な実装手順、コード例、トラブルシューティングの全記録は以下を参照してください：

**[archive/TEST_STRATEGY_IMPLEMENTATION.md](archive/TEST_STRATEGY_IMPLEMENTATION.md)**

このドキュメントには以下が含まれています：
- 各Phaseの実装手順（セットアップ、コード例、実装チェックリスト）
- 認証問題の解決過程（E2E Auth.js Database strategy対応）
- 詳細なトラブルシューティング（20+のケース）
- 設計判断の背景（MySQL vs SQLite、fileParallelism、Storage State等）
