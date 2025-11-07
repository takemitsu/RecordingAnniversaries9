# Recording Anniversaries 9

大切な記念日を記録・管理するNext.js 16アプリケーション

## プロジェクト概要

大切な記念日を記録・管理するWebアプリケーション。Next.js 16とReact 19を使用し、モダンな技術スタックで構築されています。

### 完了済み機能

- ✅ Google OAuth認証
- ✅ Passkey（WebAuthn）認証
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
- ✅ **テスト実装完了**
  - **総計: 161テスト全通過**（Unit 55 + Integration 33 + Component 51 + E2E 24）
  - 詳細は [docs/TESTING.md](docs/TESTING.md) 参照

### 未実装機能

- ❌ 通知機能（ブラウザプッシュ）
- ❌ レート制限（Server Actions）

詳細な技術スタック、プロジェクト構造、データ構造については [CLAUDE.md](CLAUDE.md) を参照してください。

## テーブル

| テーブル名 | 説明 | 主要フィールド |
|-----------|------|--------------|
| **users** | ユーザー情報 | id, name, email, google_id |
| **collections** | 記念日グループ | id, user_id, name, description, is_visible |
| **anniversaries** | 個別の記念日 | id, collection_id, name, anniversary_date (DATE型), description |
| **accounts** | OAuth連携情報 | (Auth.js用) |
| **sessions** | セッション情報 | (Auth.js用) |
| **authenticators** | Passkey認証情報 | (Auth.js用、WebAuthn) |

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
- **Passkey認証**
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
# Unit/Integration/Component テスト
npm test

# Vitest UI（ブラウザで結果確認）
npm run test:ui

# カバレッジレポート生成
npm run test:coverage

# E2Eテスト（Playwright）
npm run test:e2e

# E2E UI Mode（ブラウザでデバッグ）
npm run test:e2e:ui

# カバレッジをブラウザで確認
open coverage/index.html
```

### テスト構成

**総計: 161テスト全通過 ✅**

詳細は [docs/TESTING.md](docs/TESTING.md) 参照。

## Next.js 16 対応

- **params/searchParams** は必ず `await`
  ```typescript
  const { id } = await params;
  ```
- **React cache()** で読み取り結果をキャッシュ（Server Actions）
- **Server Actions 優先** - API Routesより推奨
- **Turbopack** デフォルト使用
- **lib/auth-helpers.ts** の requireAuth() で認証制御

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

---

詳細なドキュメント：
- **プロジェクト全体**: [CLAUDE.md](CLAUDE.md)
- **技術的決定**: [docs/TECH_DECISIONS.md](docs/TECH_DECISIONS.md)
- **セットアップ**: [docs/SETUP.md](docs/SETUP.md)
- **テスト**: [docs/TESTING.md](docs/TESTING.md)
- **TODO**: [docs/TODO.md](docs/TODO.md)
