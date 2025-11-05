# Recording Anniversaries 9

大切な記念日を記録・管理するNext.js 16アプリケーション

## 技術スタック

- **Next.js 16.0.1** - App Router, Turbopack
- **React 19.2.0** - useActionState統合
- **TypeScript 5** - Strict mode
- **Auth.js v5 (next-auth@beta.30)** - Google OAuth認証
- **Drizzle ORM 0.44** - MySQL接続
- **MySQL 8** - データベース
- **Zod 4.1** - スキーマバリデーション
- **Tailwind CSS v4** - スタイリング
- **Biome 2.2** - Linter/Formatter
- **dayjs 1.11** - 日付処理

## プロジェクト概要

大切な記念日を記録・管理するWebアプリケーション。Next.js 16とReact 19を使用し、モダンな技術スタックで構築されています。

### 完了済み機能

- ✅ Google OAuth認証
- ✅ 記念日の作成・編集・削除
- ✅ グループ（Collection）による分類
- ✅ カウントダウン・カウントアップ表示
- ✅ 和暦変換（令和、平成など）
- ✅ 2ページ構成のシンプルなUI/UX
- ✅ React 19統合（useActionState + Zodバリデーション）
- ✅ フィールドごとのエラー表示とフォーム値保持
- ✅ プロフィール設定
- ✅ レスポンシブデザイン（モバイルファースト）
- ✅ ダークモード対応
- ✅ **テスト実装（Phase 1 + Phase 2完了）**
  - Unit Tests: 55テスト（日付計算、和暦変換、Zodバリデーション）
  - Integration Tests: 27テスト（Server Actions + MySQL）
  - カバレッジ: utils 98%+, schemas 100%

### 未実装機能

- ❌ Passkey（WebAuthn）認証
- ❌ 記念日の並び替え
- ❌ 検索・フィルター機能
- ❌ カレンダー表示
- ❌ 通知機能

## プロジェクト構造

```
recording-anniversaries9/
├── app/
│   ├── (main)/
│   │   ├── page.tsx                                    # 一覧ページ（閲覧専用）
│   │   ├── edit/
│   │   │   ├── page.tsx                               # 編集ページ
│   │   │   ├── EditPageClient.tsx
│   │   │   └── collection/
│   │   │       ├── new/page.tsx                       # Collection作成
│   │   │       ├── [collectionId]/page.tsx           # Collection編集
│   │   │       └── [collectionId]/anniversary/
│   │   │           ├── new/page.tsx                   # Anniversary作成
│   │   │           └── [anniversaryId]/page.tsx      # Anniversary編集
│   │   ├── profile/
│   │   │   ├── page.tsx                               # プロフィール設定
│   │   │   └── ProfileForm.tsx
│   │   └── layout.tsx                                 # メインレイアウト
│   ├── actions/                                        # Server Actions
│   │   ├── collections.ts                             # Collection CRUD
│   │   ├── anniversaries.ts                           # Anniversary CRUD
│   │   └── profile.ts                                 # プロフィール更新
│   ├── api/auth/[...nextauth]/route.ts               # Auth.js API
│   ├── auth/signin/page.tsx                          # ログインページ
│   └── layout.tsx                                     # ルートレイアウト
├── components/
│   ├── CollectionCard.tsx                            # Collectionカード
│   ├── AnniversaryCard.tsx                           # Anniversaryカード
│   ├── forms/
│   │   ├── CollectionForm.tsx                        # Collection作成・編集フォーム
│   │   ├── AnniversaryForm.tsx                       # Anniversary作成・編集フォーム
│   │   ├── DatePickerField.tsx                       # 日付選択フィールド
│   │   └── FormField.tsx                             # 汎用フォームフィールド
│   ├── layout/
│   │   ├── Header.tsx                                 # ヘッダー（ハンバーガーメニュー）
│   │   └── Footer.tsx                                 # フッター
│   └── ui/
│       └── Button.tsx                                 # 統一Buttonコンポーネント
├── lib/
│   ├── db/
│   │   ├── schema.ts                                  # Drizzle スキーマ
│   │   ├── index.ts                                   # DB接続
│   │   └── queries.ts                                 # クエリヘルパー
│   ├── schemas/
│   │   ├── collection.ts                              # Collection Zodスキーマ
│   │   └── anniversary.ts                             # Anniversary Zodスキーマ
│   ├── utils/
│   │   ├── japanDate.ts                              # 和暦変換
│   │   └── dateCalculation.ts                        # カウントダウン計算
│   ├── env.ts                                         # 環境変数バリデーション（Zod）
│   ├── constants.ts                                   # 定数定義
│   └── auth-helpers.ts                                # 認証ヘルパー
├── hooks/
│   └── useConfirmDelete.tsx                          # 削除確認フック
├── docs/                                              # プロジェクトドキュメント
│   ├── TECH_DECISIONS.md                             # 技術的決定
│   ├── TODO.md                                       # 未実装機能
│   └── SETUP.md                                      # セットアップ手順
├── auth.ts                                            # Auth.js v5 設定
├── proxy.ts                                           # Next.js 16 認証プロキシ
├── drizzle.config.ts                                 # Drizzle設定
└── .env.local                                        # 環境変数（要設定）
```

## データ構造

### 3層モデル

```
Users (ユーザー)
  └─ Collections (記念日グループ)
      └─ Anniversaries (個別の記念日)
```

### テーブル

| テーブル名 | 説明 | 主要フィールド |
|-----------|------|--------------|
| **users** | ユーザー情報 | id, name, email, google_id |
| **collections** | 記念日グループ | id, user_id, name, description, is_visible |
| **anniversaries** | 個別の記念日 | id, collection_id, name, anniversary_date (DATE型), description |
| **accounts** | OAuth連携情報 | (Auth.js用) |
| **sessions** | セッション情報 | (Auth.js用) |

**注**: ソフトデリート（deleted_at）は実装されていません。

## セットアップ

詳細は [docs/SETUP.md](docs/SETUP.md) を参照してください。

### クイックスタート

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定（.env.local）

**重要**: 環境変数は`lib/env.ts`でZodバリデーションされます。不足・誤設定があるとビルドが失敗します。
```env
# Database
DATABASE_URL="mysql://user:password@127.0.0.1:3306/database"

# Test Database (Integration Tests用)
TEST_DATABASE_URL="mysql://user:password@127.0.0.1:3306/ra9_test"

# Auth.js
AUTH_SECRET="LiLwuByyqzL8IX2EyVtFSlpzuaQMHg3YFSxgMP9kZmQ="
AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. http://localhost:3000 にアクセス

## 主な機能

### 認証
- **Google OAuth** - ワンクリックログイン
- **セッション管理** - database strategy
- **認証ヘルパー** - getUserId()でユーザーID取得

### 記念日管理
- **Collection（グループ）** でカテゴリ分け（家族、友人など）
- **カウントダウン表示** - 次の記念日まであと何日
- **カウントアップ表示** - 何年経過したか（例: 5年（6年目））
- **和暦変換** - 令和、平成などの元号表示
- **日付表示** - 西暦（和暦）形式（例: 2014-11-01（平成26年））

### UI/UX
- **2ページ構成**
  - `/` - 一覧ページ（閲覧専用）
  - `/edit` - 編集ページ（全機能アクセス可能）
- **フルスクリーンフォーム** - モバイルで入力しやすい
- **レスポンシブデザイン** - モバイル: p-2, デスクトップ: lg:p-12
- **ハンバーガーメニュー** - モバイル向けナビゲーション
- **カラフルなカウントダウン** - 視覚的に楽しいデザイン

### React 19統合
- **useActionState** - フォーム状態管理
- **Zodバリデーション** - 型安全なサーバーサイドバリデーション
- **フィールドごとのエラー表示** - 複数フィールドのエラーを同時表示
- **フォーム値保持** - バリデーションエラー時も入力値を保持
- **HTML5バリデーション** - required属性による即座のフィードバック
- **Pending状態表示** - ボタンdisable、ローディング表示

### 環境変数の型安全性
- **Zodバリデーション** - ビルド時に環境変数をチェック（`lib/env.ts`）
- **TypeScript型拡張** - `process.env`の自動補完対応
- **型安全なアクセス** - `env.DATABASE_URL`等

### プロフィール設定
- **ユーザー名変更** - `/profile`ページ
- **useActionState統合** - React 19標準パターン

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Lint
npm run lint

# フォーマット
npm run format

# テスト
npm test              # Unit + Integration Tests（82テスト）
npm run test:ui       # Vitest UI（ブラウザで結果確認）
npm run test:coverage # カバレッジレポート生成

# Drizzle Studio（DBビューアー）
npx drizzle-kit studio
```

## テスト実行

### 前提条件

Integration Tests実行にはテスト専用のMySQLデータベースが必要です。

```sql
CREATE DATABASE ra9_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

`.env.local` に `TEST_DATABASE_URL` を設定:

```env
TEST_DATABASE_URL="mysql://user:password@127.0.0.1:3306/ra9_test"
```

### テスト実行コマンド

```bash
# 全テスト実行（Unit + Integration）
npm test

# Vitest UI（ブラウザで結果確認）
npm run test:ui

# カバレッジレポート生成
npm run test:coverage

# カバレッジをブラウザで確認
open coverage/index.html
```

### テスト構成

- **Unit Tests**: 日付計算、和暦変換、Zodバリデーション（55テスト）
  - `lib/utils/dateCalculation.test.ts` - カウントダウン計算（14テスト）
  - `lib/utils/japanDate.test.ts` - 和暦変換（14テスト）
  - `lib/schemas/*.test.ts` - Zodスキーマ（27テスト）
- **Integration Tests**: Server Actions + MySQL（27テスト）
  - `__tests__/app/actions/collections.integration.test.ts` - Collections CRUD（14テスト）
  - `__tests__/app/actions/anniversaries.integration.test.ts` - Anniversaries CRUD（10テスト）
  - `__tests__/app/actions/profile.integration.test.ts` - Profile更新（3テスト）
- **カバレッジ**: utils 98%+, schemas 100%

詳細は [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md) 参照。

## Next.js 16 対応

- **params/searchParams** は必ず `await`
  ```typescript
  const { id } = await params;
  ```
- **"use cache"** でキャッシング明示（未使用）
- **Server Actions 優先** - API Routesより推奨
- **Turbopack** デフォルト使用
- **proxy.ts** で認証制御

## 日付計算の仕組み

### カウントダウン計算（年次繰り返し対応）

`lib/utils/dateCalculation.ts: calculateDiffDays()`

- 過去日の場合、**次回の記念日までの日数**を計算
- 例: 誕生日（1990-05-15）→ 次の誕生日（2025-05-15）までの日数

### 和暦変換

`lib/utils/japanDate.ts: japanDate()`

- 令和、平成、昭和、大正、明治に対応
- 元年表示対応（例: 令和元年）

## 重要な制約事項

⚠️ **データベース制約**

**現在の実装**:
- テーブル名: `collections`, `anniversaries`
- フィールド名: `description`, `anniversary_date` (camelCase in code)
- ソフトデリート: **未実装**

## ドキュメント

- [TECH_DECISIONS.md](docs/TECH_DECISIONS.md) - 技術的な決定事項
- [TODO.md](docs/TODO.md) - 未実装機能リスト
- [SETUP.md](docs/SETUP.md) - セットアップ手順

## 技術的決定事項

主要な設計判断については [docs/TECH_DECISIONS.md](docs/TECH_DECISIONS.md) を参照。

### データベース
- **DATE vs DATETIME**: DATE型採用（時刻不要、タイムゾーン問題回避）
- **Drizzle vs Prisma**: Drizzle（軽量、型安全、SQL的）

### 認証
- **Auth.js vs Better Auth**: Auth.js v5（Next.js統合、実績）

### UI
- **Tailwind CSS v4**: ユーティリティファースト
- **モバイルファースト**: p-2 → lg:p-12のパディング戦略
- **2ページ構成**: シンプルで迷わない

### ライブラリ
- **dayjs**: 軽量、日本語対応
- **Biome**: ESLint + Prettier統合

## ライセンス

Private
