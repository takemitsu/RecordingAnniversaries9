# Recording Anniversaries 9

大切な記念日を記録・管理するNext.js 16アプリケーション

## 技術スタック

- **Next.js 16.0.1** - App Router, Turbopack
- **React 19.2.0**
- **TypeScript** - Strict mode
- **Auth.js v5** - Google OAuth認証
- **Drizzle ORM** - MySQL接続
- **Tailwind CSS v4** - スタイリング
- **Biome** - Linter/Formatter
- **dayjs** - 日付処理
- **next-devtools-mcp** - 開発支援

## プロジェクト構造

```
recording-anniversaries9/
├── app/
│   ├── actions/          # Server Actions
│   │   ├── entities.ts   # Entitiesの CRUD
│   │   └── days.ts       # Daysの CRUD
│   ├── api/auth/         # Auth.js API ルート
│   ├── auth/signin/      # ログインページ
│   ├── dashboard/        # ダッシュボード
│   ├── entities/         # グループ管理
│   ├── days/             # 記念日管理
│   ├── layout.tsx        # ルートレイアウト
│   └── page.tsx          # トップページ
├── components/
│   ├── layout/           # レイアウトコンポーネント
│   │   └── Header.tsx
│   └── ui/               # UIコンポーネント
├── lib/
│   ├── db/               # データベース層
│   │   ├── schema.ts     # Drizzle スキーマ
│   │   ├── index.ts      # DB接続
│   │   └── queries.ts    # クエリヘルパー
│   ├── utils/            # ユーティリティ
│   │   ├── japanDate.ts  # 和暦変換
│   │   └── dateCalculation.ts  # カウントダウン計算
│   └── auth-helpers.ts   # 認証ヘルパー
├── docs/                 # ドキュメント
│   ├── MIGRATION_PLAN.md # 移行計画
│   ├── TASK_STATUS.md    # タスク進捗
│   ├── TECH_DECISIONS.md # 技術的決定
│   ├── CONSTRAINTS.md    # 制約事項
│   ├── SETUP.md          # セットアップ手順
│   └── COMPLETED.md      # 完了した作業
├── auth.ts               # Auth.js 設定
├── proxy.ts              # Next.js 16 認証プロキシ
├── drizzle.config.ts     # Drizzle 設定
└── .env.local            # 環境変数（要設定）
```

## セットアップ

詳細は [docs/SETUP.md](docs/SETUP.md) を参照してください。

### クイックスタート

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
# .env.local を編集
# - DATABASE_URL: MySQLデータベース接続文字列
# - AUTH_SECRET: openssl rand -base64 32 で生成
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google Cloud Consoleから取得
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. http://localhost:3000 にアクセス

## データ構造

### 3層モデル

```
Users (ユーザー)
  └─ Entities (記念日グループ)
      └─ Days (個別の記念日)
```

### テーブル

- **users** - ユーザー情報（Google OAuth対応）
- **entities** - 記念日グループ（ソフトデリート対応）
- **days** - 個別の記念日（DATE型、ソフトデリート対応）

## 主な機能

### 認証
- Google OAuth ログイン
- セッション管理

### 記念日管理
- グループ（Entities）でカテゴリ分け
- カウントダウン表示（次の記念日まであと何日）
- カウントアップ表示（何年経過したか）
- 和暦変換（令和、平成など）

### 日付計算
- 年次繰り返し対応（毎年同じ日付で記念日が来る）
- 日本語表示対応
- タイムゾーン対応（Asia/Tokyo）

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
```

## 重要な制約事項

⚠️ **既存MySQLデータベースへの変更は禁止**

recordingAnniversaries8が使用中のため、以下を厳守：
- テーブル構造の変更禁止
- マイグレーション実行禁止
- 既存データの削除・更新は慎重に（読み取りを優先）

詳細は [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md) を参照。

## ドキュメント

- [MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) - 移行計画の全体像
- [TASK_STATUS.md](docs/TASK_STATUS.md) - 現在の進捗状況
- [TECH_DECISIONS.md](docs/TECH_DECISIONS.md) - 技術的な決定事項
- [CONSTRAINTS.md](docs/CONSTRAINTS.md) - プロジェクト制約
- [SETUP.md](docs/SETUP.md) - セットアップ手順
- [COMPLETED.md](docs/COMPLETED.md) - 完了した作業内容

## Next.js 16 対応

- params/searchParams は必ず `await`
- "use cache" ディレクティブでキャッシング明示
- Server Actions 優先使用
- Turbopack デフォルト使用

## ライセンス

Private

## 作成者

recordingAnniversaries8 からの移植プロジェクト
