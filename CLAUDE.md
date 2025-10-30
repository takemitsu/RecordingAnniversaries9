# Recording Anniversaries 9 - Claude 向けプロジェクトガイド

大切な記念日を記録・管理するNext.js 16アプリケーション。recordingAnniversaries8（Laravel 11 + React）からの移行プロジェクト。

## プロジェクト概要

### 目的
- recordingAnniversaries8 を Next.js 16 + TypeScript で書き換え
- 既存MySQL DBを共有（recordingAnniversaries8と共存）
- モダンなスタックへの移行（App Router, Server Actions, Auth.js v5）

### 技術スタック
- **Next.js 16.0.1** - App Router, Turbopack
- **React 19.2.0**
- **TypeScript 5** - Strict mode
- **Auth.js v5 (next-auth@beta.30)** - 認証
- **Drizzle ORM 0.44** - データベース接続
- **MySQL 8** - SAKURA VPS上の既存DB（recordingAnniversaries8と共有）
- **Tailwind CSS v4** - スタイリング
- **Biome 2.2** - Linter/Formatter
- **dayjs 1.11** - 日付処理

## ディレクトリ構造

```
recording-anniversaries9/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── entities.ts       # Entities CRUD（作成/更新/削除/取得）
│   │   └── days.ts           # Days CRUD（作成/更新/削除/取得）
│   ├── api/auth/[...nextauth]/route.ts  # Auth.js API
│   ├── auth/                 # 認証関連ページ
│   │   └── signin/page.tsx
│   ├── dashboard/page.tsx    # ダッシュボード（記念日一覧）
│   ├── entities/             # グループ管理
│   │   ├── page.tsx          # 一覧
│   │   ├── new/page.tsx      # 新規作成
│   │   └── [id]/             # 詳細/編集
│   ├── days/                 # 記念日管理
│   ├── layout.tsx            # ルートレイアウト
│   └── page.tsx              # トップページ（ログイン/ダッシュボードへ誘導）
├── components/
│   ├── layout/Header.tsx     # ヘッダー（ナビゲーション）
│   └── ui/                   # UIコンポーネント（Modal, ConfirmDialog等）
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Drizzle スキーマ定義
│   │   ├── index.ts          # DB接続
│   │   └── queries.ts        # クエリヘルパー（entityQueries, dayQueries）
│   ├── utils/
│   │   ├── japanDate.ts      # 和暦変換（令和、平成など）
│   │   └── dateCalculation.ts  # 日付計算（カウントダウン/カウントアップ）
│   └── auth-helpers.ts       # 認証ヘルパー（getUserId）
├── docs/                     # プロジェクトドキュメント
│   ├── MIGRATION_PLAN.md     # 移行計画
│   ├── TASK_STATUS.md        # タスク進捗
│   ├── TECH_DECISIONS.md     # 技術的決定
│   ├── CONSTRAINTS.md        # 制約事項
│   ├── SETUP.md              # セットアップ手順
│   ├── COMPLETED.md          # 完了した作業
│   └── TODO.md               # 未実装機能
├── auth.ts                   # Auth.js v5 設定
├── proxy.ts                  # Next.js 16 認証プロキシ
├── drizzle.config.ts         # Drizzle設定
├── .env.local                # 環境変数
└── package.json
```

## データベース設計

### 重要な制約 🚨
**既存MySQLデータベースへの変更は禁止**

recordingAnniversaries8（Laravel版）が動作中のため：
- ❌ テーブル構造の変更（ALTER TABLE）
- ❌ 新規テーブルの作成（CREATE TABLE）※Auth.js用テーブル除く
- ❌ マイグレーションの実行
- ✅ 既存データの読み取り（SELECT）
- ✅ 新規データの追加（INSERT）

詳細: `docs/CONSTRAINTS.md`

### データ構造（3層モデル）

```
Users (ユーザー)
  └─ Entities (記念日グループ)
      └─ Days (個別の記念日)
```

### テーブル一覧

#### アプリケーションコア
1. **users** - ユーザー情報
   - 既存テーブル（Laravel互換）
   - Google OAuth対応（google_id カラム）

2. **entities** - 記念日グループ
   - ソフトデリート対応（deleted_at）
   - user_id で紐付け

3. **days** - 個別の記念日
   - ソフトデリート対応（deleted_at）
   - entity_id で紐付け
   - **anniv_at は DATE型**（datetime不可）

#### Laravel関連（変更禁止）
- sessions - Laravel セッション
- cache, cache_locks - Laravel キャッシュ
- jobs, job_batches, failed_jobs - Laravel Queue
- migrations - Laravel マイグレーション
- password_reset_tokens - Laravel パスワードリセット

#### WebAuthn
- **webauthn_credentials** - Passkey 認証情報（既存）

#### Auth.js用（完了）
- **accounts** - OAuth連携情報（Google）
- **auth_sessions** - Auth.jsセッション（既存sessionsと区別）
- **__drizzle_migrations** - Drizzle マイグレーション履歴

### スキーマ定義

`lib/db/schema.ts`参照。重要ポイント：
- `days.anniv_at` は `date("anniv_at", { mode: "string" })`
- ソフトデリート: `deletedAt: timestamp("deleted_at")`
- リレーション定義済み（Drizzle Relations）

## 完了済み機能 ✅

### 認証
- ✅ Auth.js v5 設定
- ✅ Google OAuth プロバイダー設定
- ✅ Google OAuth 認証動作確認（ログイン/セッション/ダッシュボードアクセス）
- ✅ セッション管理（database strategy）
- ✅ 認証ヘルパー（getUserId）
- ✅ Auth.js用DBテーブル作成（accounts, auth_sessions）
- ✅ カスタムアダプター実装（AUTO_INCREMENT対応）
- ❌ **Passkey（WebAuthn）は未実装**

### データベース
- ✅ Drizzle スキーマ定義（users, entities, days, accounts, auth_sessions）
- ✅ MySQL接続設定
- ✅ クエリヘルパー実装
- ✅ ソフトデリート対応
- ✅ Drizzleマイグレーション実装（generate + migrate）

### Server Actions
- ✅ Entities CRUD（作成/更新/削除/取得）
- ✅ Days CRUD（作成/更新/削除/取得）
- ✅ ユーザーごとのデータ分離
- ✅ revalidatePath によるキャッシュ無効化

### UI
- ✅ 認証ページ（Google ログイン）
- ✅ ダッシュボード（記念日一覧表示）
- ✅ グループ管理（作成/編集/削除）
- ✅ 記念日管理（作成/編集/削除）
- ✅ レスポンシブデザイン
- ✅ Header コンポーネント（ナビゲーション）

### 日付計算
- ✅ カウントダウン計算（年次繰り返し対応）
  - `lib/utils/dateCalculation.ts: calculateDiffDays()`
  - 過去日の場合、次回の記念日までの日数を計算
- ✅ カウントアップ計算（経過年数）
- ✅ 和暦変換（令和、平成など）
  - `lib/utils/japanDate.ts`

### 開発環境
- ✅ TypeScript strict mode
- ✅ Biome設定（lint/format）
- ✅ Next.js 16 対応（proxy.ts使用）
- ✅ 環境変数設定（.env.local）
- ✅ 開発用DB接続（Docker MySQL）

### ドキュメント
- ✅ README.md
- ✅ 詳細ドキュメント（docs/）
- ✅ セットアップ手順

## 未実装機能・次にやること 🚧

### 🔴 優先: Passkey（WebAuthn）実装

**現状**:
- `webauthn_credentials`テーブルは既存DB内に存在
- `@simplewebauthn/server`, `@simplewebauthn/browser` インストール済み
- Auth.js v5のWebAuthn対応を調査中

**実装方針**:
1. Auth.js v5の公式WebAuthnプロバイダーを使用（推奨）
2. または`@simplewebauthn`で独自実装

### 機能拡張
- [ ] 記念日の並び替え機能
- [ ] 記念日の検索・フィルター機能
- [ ] カレンダー表示
- [ ] 通知機能（メール/プッシュ通知）
- [ ] 記念日のインポート/エクスポート
- [ ] ダークモード対応

### UI/UX
- [ ] recordingAnniversaries8のUIとの詳細な比較
- [ ] アニメーション追加
- [ ] モバイル最適化
- [ ] アクセシビリティ改善（残りBiomeエラー対応）

### パフォーマンス
- [ ] "use cache"によるキャッシング最適化
- [ ] 画像最適化
- [ ] コード分割

### テスト
- [ ] E2Eテスト（Playwright）
- [ ] Unitテスト（Vitest）

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
- [ ] SAKURA VPS デプロイ

## 環境変数

### 必要な環境変数（.env.local）

```env
# Database
DATABASE_URL="mysql://ra8_user:password@127.0.0.1:3306/ra8"

# Auth.js
AUTH_SECRET="LiLwuByyqzL8IX2EyVtFSlpzuaQMHg3YFSxgMP9kZmQ=" # 生成済み
AUTH_URL="http://localhost:3000"

# Google OAuth（要設定）
GOOGLE_CLIENT_ID=""  # ← 未設定
GOOGLE_CLIENT_SECRET=""  # ← 未設定

# WebAuthn
NEXT_PUBLIC_WEBAUTHN_RP_ID="localhost"
NEXT_PUBLIC_WEBAUTHN_RP_NAME="Recording Anniversaries"
NEXT_PUBLIC_WEBAUTHN_ORIGIN="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_NAME="Recording Anniversaries 9"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="Asia/Tokyo"
```

### 環境変数の取得方法

#### Google OAuth
1. https://console.cloud.google.com/ にアクセス
2. プロジェクト作成
3. 「APIとサービス」→「認証情報」
4. 「OAuth 2.0 クライアントID」を作成
5. 承認済みのリダイレクトURI: `http://localhost:3000/api/auth/callback/google`

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

# Drizzle
npx drizzle-kit studio  # Drizzle Studio（DBビューアー）
npx drizzle-kit push     # スキーマ変更を反映（注意: 既存DB変更禁止）
npx drizzle-kit generate # マイグレーションファイル生成
```

## データベース接続

### 開発環境（Docker MySQL）

```bash
# 接続
mysql -h 127.0.0.1 -P 3306 -u ra8_user -ppassword ra8

# テーブル確認
SHOW TABLES;

# Auth.js用テーブル確認（追加後）
DESC accounts;
DESC auth_sessions;
```

### 既存テーブル一覧

```
cache                    - Laravel cache
cache_locks              - Laravel cache
days                     - 記念日
entities                 - グループ
failed_jobs              - Laravel jobs
job_batches              - Laravel jobs
jobs                     - Laravel jobs
migrations               - Laravel migrations
password_reset_tokens    - Laravel auth
sessions                 - Laravel sessions
users                    - ユーザー
webauthn_credentials     - Passkey
```

## Next.js 16 対応

### 重要な変更点
1. **params/searchParams は必ず await**
   ```typescript
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }
   ```

2. **"use cache" でキャッシング明示**
   ```typescript
   "use cache";
   export async function getCachedData() {
     // ...
   }
   ```

3. **proxy.ts を使用**
   - `middleware.ts`の代わりに`proxy.ts`で認証制御

4. **Server Actions 優先**
   - API Routesより Server Actions を優先使用

## トラブルシューティング

### Auth.js関連

#### 問題: ログインできない
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` が設定されているか確認
- [ ] Google Cloud ConsoleでリダイレクトURIが正しく設定されているか
- [ ] `accounts`, `auth_sessions`テーブルが作成されているか

#### 問題: セッションが維持されない
- [ ] `AUTH_SECRET`が設定されているか
- [ ] `auth_sessions`テーブルが作成されているか

### Drizzle関連

#### 問題: DB接続エラー
- [ ] `DATABASE_URL`が正しいか確認
- [ ] MySQLサーバーが起動しているか確認
  ```bash
  mysql -h 127.0.0.1 -P 3306 -u ra8_user -ppassword ra8
  ```

### TypeScript/Biome関連

#### 既知のBiome警告（許容範囲）
- Modal/ConfirmDialogの`role="button"`警告（2件）
  - 機能的には問題なし
  - キーボードアクセシビリティ実装済み

## 技術的決定事項

詳細は `docs/TECH_DECISIONS.md` 参照。

### 主要な決定
- **DATE vs DATETIME**: 記念日は DATE型（時刻不要、タイムゾーン問題回避）
- **Drizzle vs Prisma**: Drizzle（軽量、型安全、SQL的）
- **Auth.js vs Better Auth**: Auth.js v5（Next.js統合、実績）
- **Tailwind CSS v4**: ユーティリティファースト
- **dayjs**: 軽量、日本語対応
- **Biome**: ESLint + Prettier統合

## 元プロジェクトとの違い

| 項目 | recordingAnniversaries8 | recordingAnniversaries9 |
|------|------------------------|------------------------|
| フレームワーク | Laravel 11 | Next.js 16 |
| フロントエンド | React (Inertia.js) | React Server Components |
| 言語 | PHP + TypeScript | TypeScript |
| データ取得 | Controller → Inertia | Server Actions |
| 認証 | Laravel Sanctum + Socialite | Auth.js v5 |
| ORM | Eloquent | Drizzle |
| スタイリング | Tailwind CSS v3 | Tailwind CSS v4 |
| ビルド | Vite | Turbopack |

## 参考リソース

### ドキュメント
- Next.js 16: https://nextjs.org/docs
- Auth.js v5: https://authjs.dev/
- Drizzle ORM: https://orm.drizzle.team/
- Tailwind CSS v4: https://tailwindcss.com/

### 元プロジェクト
- リポジトリ: https://github.com/takemitsu/RecordingAnniversaries8
- ローカルパス: `../recordingAnniversaries8`
- 参考実装:
  - `resources/js/util/japanDate.ts` - 和暦変換
  - `app/Services/DateCalculationService.php` - 日付計算

## 開発フロー

### 新機能追加時
1. `docs/TODO.md`に追加
2. 必要に応じてスキーマ変更（**既存テーブル変更禁止**）
3. Server Actions実装（`app/actions/`）
4. UI実装（`app/`）
5. テスト
6. ドキュメント更新

### バグ修正時
1. 再現手順確認
2. 該当コード特定
3. 修正
4. テスト
5. コミット

## Gitコミット履歴

```
0f39a65 - ドキュメント整備とREADME更新
5fcf784 - TypeScript/Biomeエラー修正とアクセシビリティ改善
81c339f - fix: 型エラー修正とNext.js 16対応
123463d - feat: Entity/Day の完全なCRUD機能実装
27e2b00 - feat: recordingAnniversaries9 初期構造作成
bfacba3 - Initial commit from Create Next App
```

## ライセンス

Private

---

**このファイルについて**
このCLAUDE.mdは、Claudeが効率的にこのプロジェクトを理解し、作業を継続するためのガイドです。プロジェクトの状態が変わったら随時更新してください。
