# Recording Anniversaries 9 - Claude 向けプロジェクトガイド

大切な記念日を記録・管理するNext.js 16アプリケーション。

## プロジェクト概要

### 目的
- 記念日の記録・管理機能の提供
- グループ（Collection）による記念日の分類
- カウントダウン・カウントアップ・和暦表示機能
- モダンな技術スタック（App Router, Server Actions, Auth.js v5, React 19）

### 技術スタック
- **Next.js 16.0.1** - App Router, Turbopack
- **React 19.2.0** - useActionState統合
- **TypeScript 5** - Strict mode
- **Auth.js v5 (next-auth@beta.30)** - 認証
- **Drizzle ORM 0.44** - データベース接続
- **MySQL 8** - データベース
- **Tailwind CSS v4** - スタイリング
- **Biome 2.2** - Linter/Formatter
- **dayjs 1.11** - 日付処理

## ディレクトリ構造

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
│   ├── actions/              # Server Actions
│   │   ├── collections.ts    # Collections CRUD（作成/更新/削除/取得）
│   │   ├── anniversaries.ts  # Anniversaries CRUD（作成/更新/削除/取得）
│   │   └── profile.ts        # プロフィール更新
│   ├── api/auth/[...nextauth]/route.ts  # Auth.js API
│   ├── auth/                 # 認証関連ページ
│   │   └── signin/page.tsx
│   ├── layout.tsx            # ルートレイアウト
│   └── page.tsx              # トップページ（リダイレクト）
├── components/
│   ├── CollectionCard.tsx    # Collectionカード
│   ├── AnniversaryCard.tsx   # Anniversaryカード
│   ├── forms/
│   │   ├── CollectionForm.tsx
│   │   ├── AnniversaryForm.tsx
│   │   ├── DatePickerField.tsx
│   │   └── FormField.tsx
│   ├── layout/
│   │   ├── Header.tsx        # ヘッダー（ハンバーガーメニュー）
│   │   └── Footer.tsx        # フッター
│   └── ui/
│       └── Button.tsx        # 統一Buttonコンポーネント
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Drizzle スキーマ定義
│   │   ├── index.ts          # DB接続
│   │   └── queries.ts        # クエリヘルパー（collectionQueries, anniversaryQueries）
│   ├── utils/
│   │   ├── japanDate.ts      # 和暦変換（令和、平成など）
│   │   └── dateCalculation.ts  # 日付計算（カウントダウン/カウントアップ）
│   ├── constants.ts          # 定数定義（VISIBILITY等）
│   └── auth-helpers.ts       # 認証ヘルパー（getUserId）
├── hooks/
│   └── useConfirmDelete.tsx  # 削除確認フック
├── docs/                     # プロジェクトドキュメント
│   ├── TECH_DECISIONS.md     # 技術的決定
│   ├── TODO.md               # 未実装機能
│   └── SETUP.md              # セットアップ手順
├── auth.ts                   # Auth.js v5 設定
├── proxy.ts                  # Next.js 16 認証プロキシ
├── drizzle.config.ts         # Drizzle設定
├── .env.local                # 環境変数
└── package.json
```

## データベース設計

### データ構造（3層モデル）

```
Users (ユーザー)
  └─ Collections (記念日グループ)
      └─ Anniversaries (個別の記念日)
```

### テーブル一覧

#### アプリケーションコア
1. **users** - ユーザー情報
   - 既存テーブル
   - Google OAuth対応（google_id カラム）

2. **collections** - 記念日グループ
   - user_id で紐付け
   - is_visible で一覧ページ表示/非表示制御

3. **anniversaries** - 個別の記念日
   - collection_id で紐付け
   - **anniversary_date は DATE型**
   - description は TEXT型

#### Auth.js用
- **accounts** - OAuth連携情報（Google）
- **sessions** - Auth.jsセッション

### スキーマ定義

`lib/db/schema.ts`参照。重要ポイント：
- `anniversaries.anniversary_date` は `date("anniversary_date", { mode: "string" })`
- リレーション定義済み（Drizzle Relations）
- ソフトデリート（deleted_at）は**未実装**

## 完了済み機能 ✅

### 認証
- ✅ Auth.js v5 設定
- ✅ Google OAuth プロバイダー設定
- ✅ Google OAuth 認証動作確認（ログイン/セッション/ダッシュボードアクセス）
- ✅ セッション管理（database strategy）
- ✅ 認証ヘルパー（getUserId）
- ✅ Auth.js用DBテーブル（accounts, sessions）
- ❌ **Passkey（WebAuthn）は未実装**

### データベース
- ✅ Drizzle スキーマ定義（users, collections, anniversaries, accounts, sessions）
- ✅ MySQL接続設定
- ✅ クエリヘルパー実装（collectionQueries, anniversaryQueries）
- ✅ Drizzleマイグレーション実装（generate + migrate）

### Server Actions
- ✅ Collections CRUD（作成/更新/削除/取得）
  - `createCollection`, `updateCollection`, `deleteCollection`
  - `getCollections`, `getCollectionsWithAnniversaries`, `getCollection`
- ✅ Anniversaries CRUD（作成/更新/削除/取得）
  - `createAnniversary`, `updateAnniversary`, `deleteAnniversary`
  - `getAnniversary`
- ✅ Profile 更新（`updateProfile`）
- ✅ ユーザーごとのデータ分離
- ✅ revalidatePath によるキャッシュ無効化

### React 19統合
- ✅ `useActionState` によるフォーム状態管理
  - CollectionForm
  - AnniversaryForm
  - ProfileForm
- ✅ HTML5バリデーション統合（required, minLength）
- ✅ サーバーサイドエラーハンドリング
- ✅ Pending状態表示（ボタンdisable、ローディング表示）

### UI（ra8準拠のリファクタリング完了）
- ✅ **2ページ構成**
  - `/` - 一覧ページ（閲覧専用）
  - `/edit` - 編集ページ（全機能アクセス可能）
- ✅ **フルスクリーンフォーム**
  - `/edit/collection/new` - Collection作成
  - `/edit/collection/[collectionId]` - Collection編集
  - `/edit/collection/[collectionId]/anniversary/new` - Anniversary作成
  - `/edit/collection/[collectionId]/anniversary/[anniversaryId]` - Anniversary編集
- ✅ **プロフィール設定**
  - `/profile` - ユーザー名変更
- ✅ **レスポンシブデザイン**
  - モバイル: `p-2`
  - デスクトップ: `lg:p-12`
- ✅ **ハンバーガーメニュー**（モバイル: `sm:hidden`）
- ✅ **ダークモード対応**

### コンポーネント
- ✅ `components/CollectionCard.tsx` - ra8準拠
- ✅ `components/AnniversaryCard.tsx` - ra8準拠
- ✅ `components/forms/CollectionForm.tsx`
- ✅ `components/forms/AnniversaryForm.tsx`
- ✅ `components/forms/DatePickerField.tsx`
- ✅ `components/forms/FormField.tsx`
- ✅ `components/layout/Header.tsx` - ハンバーガーメニュー実装済み
- ✅ `components/layout/Footer.tsx` - フッター実装
- ✅ `components/ui/Button.tsx` - 統一Buttonコンポーネント

### 日付計算
- ✅ カウントダウン計算（年次繰り返し対応）
  - `lib/utils/dateCalculation.ts: calculateDiffDays()`
  - 過去日の場合、次回の記念日までの日数を計算
- ✅ カウントアップ計算（経過年数）
  - `getAges()` - 例: 5年（6年目）
- ✅ 和暦変換（令和、平成など）
  - `lib/utils/japanDate.ts`
  - 元年表示対応
- ✅ 日付表示フォーマット
  - 西暦（和暦）形式 - 例: 2014-11-01（平成26年）

### 開発環境
- ✅ TypeScript strict mode
- ✅ Biome設定（lint/format）
- ✅ Next.js 16 対応（proxy.ts使用）
- ✅ 環境変数設定（.env.local）

### ドキュメント
- ✅ README.md
- ✅ 詳細ドキュメント（docs/）
- ✅ セットアップ手順

## 未実装機能・次にやること 🚧

### 🔴 優先: Passkey（WebAuthn）実装

**現状**:
- Auth.js v5のWebAuthn対応を調査中
- `@simplewebauthn/server`, `@simplewebauthn/browser` インストール済み

**実装方針**:
1. Auth.js v5の公式WebAuthnプロバイダーを使用（推奨）
2. または`@simplewebauthn`で独自実装

### 機能拡張
- [ ] 記念日の並び替え機能
- [ ] 記念日の検索・フィルター機能
- [ ] カレンダー表示
- [ ] 通知機能（メール/プッシュ通知）
- [ ] 記念日のインポート/エクスポート

### テスト
- [ ] E2Eテスト（Playwright）
- [ ] Unitテスト（Vitest）

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定

## 環境変数

### 必要な環境変数（.env.local）

```env
# Database
DATABASE_URL="mysql://user:password@127.0.0.1:3306/database"

# Auth.js
AUTH_SECRET="LiLwuByyqzL8IX2EyVtFSlpzuaQMHg3YFSxgMP9kZmQ=" # 生成済み
AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

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
npx drizzle-kit generate # マイグレーションファイル生成
```

## Next.js 16 対応

### 重要な変更点
1. **params/searchParams は必ず await**
   ```typescript
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }
   ```

2. **"use cache" でキャッシング明示**（未使用）
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
- [ ] `accounts`, `sessions`テーブルが作成されているか

#### 問題: セッションが維持されない
- [ ] `AUTH_SECRET`が設定されているか
- [ ] `sessions`テーブルが作成されているか

### Drizzle関連

#### 問題: DB接続エラー
- [ ] `DATABASE_URL`が正しいか確認
- [ ] MySQLサーバーが起動しているか確認
  ```bash
  mysql -h 127.0.0.1 -P 3306 -u user -ppassword database
  ```

## 技術的決定事項

詳細は `docs/TECH_DECISIONS.md` 参照。

### 主要な決定
- **DATE vs DATETIME**: 記念日は DATE型（時刻不要、タイムゾーン問題回避）
- **Drizzle vs Prisma**: Drizzle（軽量、型安全、SQL的）
- **Auth.js vs Better Auth**: Auth.js v5（Next.js統合、実績）
- **Tailwind CSS v4**: ユーティリティファースト
- **dayjs**: 軽量、日本語対応
- **Biome**: ESLint + Prettier統合

## UI/UX設計の意図

### 設計思想：Collection中心アーキテクチャ

このプロジェクトは**Collection（グループ）を中心としたデータ構造**を採用しています。

```
users (ユーザー)
  └─ collections (グループ: 家族、友人、仕事など)
      └─ anniversaries (記念日: 誕生日、記念日など)
```

**重要な原則**:
- Anniversary（記念日）は Collection（グループ）に属する
- Collection が Anniversary を所有する階層構造
- UIはこのデータ構造を忠実に反映する

### ページ構成

#### `/` (トップページ) - 一覧ページ（閲覧専用）
- Collectionごとにカード表示
- 各CollectionCard内にAnniversariesをネスト表示
- 記念日があるCollectionのみ表示
- 操作ボタンなし（閲覧専用）

#### `/edit` - 編集ページ
- 全Collectionを表示（記念日がなくてもOK）
- Collection単位の操作: 削除、編集、Anniversary追加
- Anniversary単位の操作: 削除、編集
- 一画面で全ての管理が可能

#### フォームページ
- `/edit/collection/new` - Collection作成
- `/edit/collection/[id]` - Collection編集
- `/edit/collection/[collectionId]/anniversary/new` - Anniversary作成（**Collectionは固定**）
- `/edit/collection/[collectionId]/anniversary/[anniversaryId]` - Anniversary編集（**Collectionは変更不可**）

### モバイルファースト戦略

**パディング**:
- モバイル: `p-2` - 画面を有効活用
- デスクトップ: `lg:p-12` - 広々とした表示

**ハンバーガーメニュー**:
- `sm:hidden` でモバイル時に表示
- ナビゲーションは「一覧」「編集」「プロフィール」の3つ

**日付表示**:
- モバイル: 適切に表示
- デスクトップ: より詳細な情報

**ボタン**:
- モバイル: テキスト付き、大きめ（タップしやすい）
- デスクトップ: アイコン+テキスト

**カード**:
- border-t のみ（シンプル）
- 背景なし（透過）
- コンパクトで情報密度が高い

### カラースキーム

**ボタン**:
- Danger（削除）: ピンク (`bg-pink-500`)
- Warning（編集）: イエロー (`bg-yellow-500`)
- Primary（追加）: スカイブルー (`bg-sky-500`)

**カウントダウン**:
- 日数: 青 (`text-blue-600`)
- 単位: グレー (`text-gray-600`)
- カラフルで視覚的に楽しいデザイン

**和暦・年齢**:
- グレー系 (`text-gray-600`)

**フッター**:
- 背景: `bg-white dark:bg-gray-800`
- テキスト: `text-gray-800 dark:text-gray-400`
- 右寄せ配置（EOF感を演出）

### UI/UX設計の原則

1. **Collection中心の階層構造** - データ構造をUIに忠実に反映
2. **2ページ構成** - 一覧（閲覧）と編集を明確に分離
3. **CollectionからAnniversaryを追加** - グループが決まってから記念日を追加
4. **モバイルファースト** - ハンバーガーメニュー、レスポンシブパディング
5. **カラフルなカウントダウン** - 視覚的に楽しいUI

### 設計判断の背景

**なぜCollection中心なのか**:
- 記念日はグループに属するものだから
- 「家族の誕生日」「友人の記念日」など、カテゴリ分けが自然
- データベースでも `anniversaries.collection_id` で Collection に紐付いている

**なぜ2ページ構成なのか**:
- シンプルで迷わない
- 「見る」と「編集する」を明確に分離
- 統計ダッシュボードは不要（ユーザーが見たいのは記念日そのもの）

**なぜフルスクリーンフォームなのか**:
- モバイルで入力しやすい
- 日付選択時にキーボードが出ても問題ない
- DatePickerを広く表示できる

## 開発フロー

### 新機能追加時
1. `docs/TODO.md`に追加
2. 必要に応じてスキーマ変更
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

## 参考リソース

### ドキュメント
- Next.js 16: https://nextjs.org/docs
- Auth.js v5: https://authjs.dev/
- Drizzle ORM: https://orm.drizzle.team/
- Tailwind CSS v4: https://tailwindcss.com/

## ライセンス

Private

---

**このファイルについて**
このCLAUDE.mdは、Claudeが効率的にこのプロジェクトを理解し、作業を継続するためのガイドです。プロジェクトの状態が変わったら随時更新してください。
