# Recording Anniversaries 9 移行計画

## プロジェクト概要

recordingAnniversaries8 (Laravel 11 + React) を Next.js 16 + TypeScript で書き換えるプロジェクト。

## 技術スタック

### フロントエンド・フレームワーク
- **Next.js**: 16.0.1 (App Router)
- **React**: 19.2.0
- **TypeScript**: strict mode
- **Turbopack**: デフォルト dev server

### 認証
- **Auth.js v5** (next-auth@beta)
  - Google OAuth
  - Passkey (WebAuthn)

### データベース・ORM
- **Drizzle ORM**: MySQLアダプター
- **MySQL**: SAKURA VPS上の既存DB
- **mysql2**: ドライバー

### スタイリング・UI
- **Tailwind CSS**: v4
- **レスポンシブデザイン**
- **ダークモード対応**

### 開発ツール
- **Biome**: Linter/Formatter
- **next-devtools-mcp**: 開発支援

## データ構造

### 3層構造
```
Users (ユーザー)
  └─ Entities (記念日カテゴリ/グループ)
      └─ Days (個別の記念日)
```

### テーブル設計

#### users
- `id`: bigint (主キー)
- `name`: varchar(255)
- `email`: varchar(255) unique
- `email_verified_at`: timestamp nullable
- `password`: varchar(255) nullable (OAuth時)
- `google_id`: varchar(255) nullable unique
- `created_at`: timestamp
- `updated_at`: timestamp

#### entities
- `id`: bigint (主キー)
- `user_id`: bigint (外部キー → users)
- `name`: varchar(255) - グループ名
- `desc`: text nullable - 説明
- `status`: tinyint default 0 - ステータス
- `created_at`: timestamp
- `updated_at`: timestamp
- `deleted_at`: timestamp nullable - **ソフトデリート**

#### days
- `id`: bigint (主キー)
- `entity_id`: bigint (外部キー → entities)
- `name`: varchar(255) - 記念日名
- `desc`: text nullable - 説明
- `anniv_at`: **DATE** - 記念日（日付のみ、datetime不可）
- `created_at`: timestamp
- `updated_at`: timestamp
- `deleted_at`: timestamp nullable - **ソフトデリート**

#### webauthn_credentials
- Passkey (WebAuthn) 用のテーブル
- `@simplewebauthn/server` または Auth.js の WebAuthn アダプター用

## 重要な実装要件

### 1. 日付型について
- **必ず DATE 型を使用**（datetime ではない）
- 時刻情報は不要で、日付のみを扱う

### 2. ソフトデリート
- `entities` と `days` テーブルは `deleted_at` カラムでソフトデリート対応
- 物理削除はせず、論理削除で対応

### 3. 日付計算ロジック

#### カウントダウン機能
次の記念日まであと何日か（年次繰り返し対応）

**ロジック**:
```typescript
// 移植元: app/Services/DateCalculationService.php
// 1. 未来日の場合: その日までの日数を返す
// 2. 今日が記念日の場合: 0 を返す
// 3. 過去日の場合:
//    - 今年の記念日がまだ来ていない → 今年の記念日までの日数
//    - 今年の記念日は既に過ぎている → 来年の記念日までの日数
```

#### カウントアップ機能
記念日から何年経過したか

**ロジック**:
```typescript
// 移植元: resources/js/util/japanDate.ts の getAges()
// 1. 未来日の場合: 空文字を返す
// 2. 過去日の場合: "X年（X+1年目）" を返す
```

#### 和暦変換
西暦を和暦（令和、平成、昭和など）に変換

**ロジック**:
```typescript
// 移植元: resources/js/util/japanDate.ts の japanDate()
// 元号の開始日を定義して、該当する元号と年を計算
const JAPANESE_ERAS = [
  { at: '2019-05-01', gengo: '令和' },
  { at: '1989-01-08', gengo: '平成' },
  { at: '1926-12-25', gengo: '昭和' },
  { at: '1912-07-30', gengo: '大正' },
  { at: '1868-01-25', gengo: '明治' },
]
```

### 4. Next.js 16 対応

#### async/await 必須
```typescript
// params と searchParams は必ず await
export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  // ...
}
```

#### Proxy API
```typescript
// proxy.ts を使用してクライアント・サーバー間のデータやり取りを最適化
```

#### "use cache" ディレクティブ
```typescript
// キャッシング戦略を明示的に定義
"use cache";
export async function getCachedData() {
  // ...
}
```

### 5. Auth.js v5 の設定

#### 認証プロバイダー
- **Google OAuth**: 既存の Google 認証を移行
- **Passkey (WebAuthn)**: 新規実装

#### 互換性確認
- Next.js 16 との peer dependency を確認
- エラーが出る場合は `--legacy-peer-deps` または Better Auth を検討

## 移行タスク

### Phase 1: 基盤セットアップ
- [x] プロジェクト作成（create-next-app）
- [ ] 依存関係インストール
- [ ] 環境変数設定（.env.local）

### Phase 2: データベース層
- [ ] Drizzle スキーマ定義
- [ ] Drizzle 設定ファイル作成
- [ ] MySQL接続確認

### Phase 3: 認証機能
- [ ] Auth.js v5 設定
- [ ] Google OAuth 実装
- [ ] Passkey (WebAuthn) 実装
- [ ] 認証ミドルウェア設定

### Phase 4: コアロジック
- [ ] 日付計算ユーティリティ実装
  - [ ] japanDate.ts 移植
  - [ ] dateCalculation.ts 移植
- [ ] Server Actions 実装
  - [ ] Entities CRUD
  - [ ] Days CRUD

### Phase 5: UI実装
- [ ] レイアウトコンポーネント
- [ ] 認証画面（ログイン/サインアップ）
- [ ] ダッシュボード
- [ ] Entities 管理画面
- [ ] Days 管理画面
- [ ] レスポンシブデザイン対応
- [ ] ダークモード対応

### Phase 6: テスト・デプロイ
- [ ] 動作確認
- [ ] 既存データ移行テスト
- [ ] 本番環境へのデプロイ

## 🚨 重要な制約

**既存MySQLデータベースへの変更は絶対に禁止**

recordingAnniversaries8が現在使用中のため、以下を厳守：
- テーブル構造の変更禁止
- マイグレーション実行禁止
- 既存データの削除・更新禁止（読み取りのみ）

詳細は `docs/CONSTRAINTS.md` を参照。

## 参照ドキュメント

- 既存プロジェクト: `../recordingAnniversaries8`
- CLAUDE.md: `../recordingAnniversaries8/CLAUDE.md`
- 日付ユーティリティ: `../recordingAnniversaries8/resources/js/util/japanDate.ts`
- 日付計算サービス: `../recordingAnniversaries8/app/Services/DateCalculationService.php`
- 制約事項: `docs/CONSTRAINTS.md`

## Node.js バージョン要件

Next.js 16 は **Node.js 20.9+** が必要です。
