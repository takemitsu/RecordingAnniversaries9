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
  - `lib/db/schema.ts` - users, entities, days, accounts, auth_sessions テーブル
  - ソフトデリート対応
  - DATE型使用

- Drizzle 設定
  - `drizzle.config.ts` 作成（tablesFilter設定済み）
  - `lib/db/index.ts` - DB接続設定
  - `lib/db/queries.ts` - クエリヘルパー関数

- Drizzle マイグレーション
  - `scripts/migrate.ts` - マイグレーション実行スクリプト
  - `drizzle/0000_add_auth_tables.sql` - Auth.js用テーブル
  - マイグレーション履歴管理

### Phase 3: 認証機能 ✅ 完了

#### ✅ 完了
- Auth.js v5 設定
  - `auth.ts` - Google OAuth設定
  - カスタムアダプター実装（AUTO_INCREMENT対応）
  - Drizzle アダプター統合
  - セッション管理（database strategy）

- Auth.js用DBテーブル
  - `accounts` テーブル作成
  - `auth_sessions` テーブル作成
  - Drizzleマイグレーション実行（generate + migrate）
  - `drizzle.config.ts`でtablesFilter設定

- 認証ルート
  - `app/api/auth/[...nextauth]/route.ts`
  - `proxy.ts` - Next.js 16認証プロキシ
  - `lib/auth-helpers.ts` - 認証ヘルパー関数

- Google OAuth動作確認
  - ログイン成功
  - ユーザー作成（bigint AUTO_INCREMENT）
  - セッション管理
  - ダッシュボードアクセス

### Phase 4: コアロジック ✅ 完了

#### ✅ 完了
- 日付計算ユーティリティ
  - `lib/utils/japanDate.ts` - 和暦変換、経過年数計算
  - `lib/utils/dateCalculation.ts` - カウントダウン計算

- Server Actions
  - `app/actions/entities.ts` - Entities CRUD
  - `app/actions/days.ts` - Days CRUD

### Phase 5: UI実装 ✅ 完了

#### ✅ 完了
- 共通コンポーネント
  - `app/layout.tsx` - ルートレイアウト
  - `components/layout/Header.tsx` - ヘッダー
  - ナビゲーション

- 認証画面
  - `app/auth/signin/page.tsx` - ログインページ
  - Google OAuth ボタン
  - 自動リダイレクト

- メイン画面
  - `app/dashboard/page.tsx` - ダッシュボード
  - `app/entities/page.tsx` - Entities 一覧
  - `app/entities/new/page.tsx` - Entity作成
  - `app/entities/[id]/page.tsx` - Entity編集
  - `app/days/page.tsx` - Days 一覧
  - 日付表示（カウントダウン/カウントアップ/和暦）

- スタイリング
  - レスポンシブデザイン
  - Tailwind CSS v4

#### ⏳ 未実装
  - ダークモード対応
  - Passkey 登録・認証

### Phase 6: テスト・デプロイ

#### ⏳ 未着手
- 動作確認
- データ移行テスト
- 本番環境デプロイ

## 次のアクション

1. Passkey（WebAuthn）実装
2. エラーページ作成（/auth/error）
3. UI/UX改善
4. テスト実装

## 注意事項

- 全ての日付フィールドは DATE 型を使用（datetime ではない）
- entities と days はソフトデリート対応必須
- Next.js 16 では params/searchParams は必ず await
- Auth.js v5 と Next.js 16 の互換性を確認すること
