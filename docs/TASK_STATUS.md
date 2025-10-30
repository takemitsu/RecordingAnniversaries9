# タスク進捗状況

最終更新: 2025-10-30

## 現在のステータス

### Phase 1: 基盤セットアップ ✅ 完了

#### ✅ 完了
- プロジェクト作成（create-next-app with Next.js 16.0.1）
  - TypeScript
  - Tailwind CSS v4
  - App Router
  - Turbopack
  - Biome

- 依存関係インストール
  - Auth.js v5 (next-auth@beta)
  - Drizzle ORM
  - MySQL2
  - dayjs
  - @simplewebauthn/server & @simplewebauthn/browser

- 環境変数設定
  - .env.local.example 作成
  - .env.local 作成（値は要設定）

### Phase 2: データベース層 ✅ 完了

#### ✅ 完了
- Drizzle スキーマ定義
  - `lib/db/schema.ts` - users, entities, days テーブル
  - ソフトデリート対応
  - DATE型使用

- Drizzle 設定
  - `drizzle.config.ts` 作成
  - `lib/db/index.ts` - DB接続設定
  - `lib/db/queries.ts` - クエリヘルパー関数

### Phase 3: 認証機能 ✅ 完了

#### ✅ 完了
- Auth.js v5 設定
  - `auth.ts` - Google OAuth設定
  - Drizzle アダプター統合
  - セッション管理

- 認証ルート
  - `app/api/auth/[...nextauth]/route.ts`
  - `middleware.ts` - 認証ミドルウェア
  - `lib/auth-helpers.ts` - 認証ヘルパー関数

#### ⚠️ 注意事項
- Auth.js Drizzle Adapterが必要とするテーブル（accounts, sessions等）が既存DBに存在しない可能性
- 必要に応じてJWT戦略への切り替えを検討

### Phase 4: コアロジック ✅ 完了

#### ✅ 完了
- 日付計算ユーティリティ
  - `lib/utils/japanDate.ts` - 和暦変換、経過年数計算
  - `lib/utils/dateCalculation.ts` - カウントダウン計算

- Server Actions
  - `app/actions/entities.ts` - Entities CRUD
  - `app/actions/days.ts` - Days CRUD

### Phase 5: UI実装 🔄 進行中

#### ⏳ 未着手
- 共通コンポーネント
  - Layout
  - Header
  - Navigation

- 認証画面
  - ログイン
  - サインアップ
  - Google OAuth ボタン
  - Passkey 登録・認証

- メイン画面
  - ダッシュボード
  - Entities 一覧・作成・編集・削除
  - Days 一覧・作成・編集・削除
  - 日付表示（カウントダウン/カウントアップ/和暦）

- スタイリング
  - レスポンシブデザイン
  - ダークモード対応

### Phase 6: テスト・デプロイ

#### ⏳ 未着手
- 動作確認
- データ移行テスト
- 本番環境デプロイ

## 次のアクション

1. 依存関係のインストール
2. .env.local の作成と設定
3. Drizzle スキーマの定義
4. Drizzle 設定ファイルの作成

## 注意事項

- 全ての日付フィールドは DATE 型を使用（datetime ではない）
- entities と days はソフトデリート対応必須
- Next.js 16 では params/searchParams は必ず await
- Auth.js v5 と Next.js 16 の互換性を確認すること
