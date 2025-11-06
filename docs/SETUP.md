# セットアップ手順

## 前提条件

- Node.js 20.9以上
- MySQL 8
- Google Cloud Consoleでのプロジェクト作成（OAuth認証用）

## 1. 環境変数の設定

`.env.local` ファイルを編集して、実際の値を設定してください。

```bash
# .env.local を編集
```

### 必須の環境変数

#### DATABASE_URL
MySQLデータベース接続文字列

```
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:3306/DATABASE_NAME"
```

#### AUTH_SECRET
認証用のシークレットキー（生成方法）

```bash
openssl rand -base64 32
```

#### Google OAuth
Google Cloud Consoleから取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「OAuthクライアントID」
5. アプリケーションの種類: ウェブアプリケーション
6. 承認済みのリダイレクトURI: `http://localhost:3000/api/auth/callback/google`
7. クライアントIDとクライアントシークレットをコピー

```
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 2. データベースの確認

### 既存DBにAuth.js用のテーブルが存在するか確認

Auth.js Drizzle Adapterが以下のテーブルを必要とします：

- `accounts` - OAuth アカウント情報
- `sessions` - セッション情報
- `verification_tokens` - 確認トークン

#### 確認方法

```sql
SHOW TABLES LIKE 'accounts';
SHOW TABLES LIKE 'sessions';
SHOW TABLES LIKE 'verification_tokens';
```

### テーブルが存在しない場合

**選択肢1**: JWT戦略に切り替える（推奨）

`auth.ts` を以下のように変更：

```typescript
export const authConfig = {
  // adapter: DrizzleAdapter(db), // この行をコメントアウト
  providers: [
    // ... 省略
  ],
  session: {
    strategy: "jwt", // "database" から "jwt" に変更
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  // ... 省略
} satisfies NextAuthConfig;
```

**選択肢2**: テーブルを追加する

⚠️ この方法はDBを変更します。必ず事前にバックアップを取ってください。

```sql
-- lib/db/schema.ts に Auth.js用のテーブル定義を追加後、
-- 手動でCREATE TABLEを実行
```

## 2.5 テストDB設定（Integration Tests用）

Integration Testsを実行する場合、テスト専用のMySQLデータベースが必要です。

### 2.5.1 テストDB作成

```sql
CREATE DATABASE ra9_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.5.2 環境変数設定

`.env.local` に追加:

```env
TEST_DATABASE_URL="mysql://USERNAME:PASSWORD@127.0.0.1:3306/ra9_test"
```

**注意**: `TEST_DATABASE_URL` は `DATABASE_URL` と同じユーザー名・パスワードでOKですが、**データベース名は別のものを指定**してください（本番データとテストデータの分離のため）。

### 2.5.3 マイグレーション自動実行

テスト実行時に自動的にマイグレーションが実行されます。詳細は [TESTING.md](TESTING.md) 参照。

### 2.5.4 テスト実行

```bash
# 全テスト実行（Unit + Integration）
npm test

# Vitest UI（ブラウザで結果確認）
npm run test:ui

# カバレッジレポート生成
npm run test:coverage
```

### トラブルシューティング

#### 問題: `TEST_DATABASE_URL is not set`

→ `.env.local` に `TEST_DATABASE_URL` を追加してください。

#### 問題: テストDB接続エラー

→ `TEST_DATABASE_URL` の接続情報を確認してください。

```bash
# 接続確認
mysql -h 127.0.0.1 -P 3306 -u USERNAME -pPASSWORD ra9_test
```

#### 問題: マイグレーションエラー

→ テストDBを作り直してください。

```sql
DROP DATABASE IF EXISTS ra9_test;
CREATE DATABASE ra9_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. 依存関係のインストール確認

```bash
npm install
```

## 4. 型チェック

```bash
npx tsc --noEmit
```

## 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## 6. 動作確認

1. トップページが表示される
2. 「ログイン」ボタンをクリック
3. 「Googleでログイン」をクリック
4. Google認証が完了すると `/`（メインページ）にリダイレクトされる

## トラブルシューティング

### Auth.js関連のエラー

#### "Adapter error" や "Database error"

→ JWT戦略に切り替えてください（上記参照）

#### "Invalid client"

→ Google OAuth の設定を確認してください
- クライアントIDとシークレットが正しいか
- リダイレクトURIが正しく設定されているか

### データベース接続エラー

#### "Access denied for user"

→ DATABASE_URL のユーザー名とパスワードを確認

#### "Unknown database"

→ データベース名が正しいか確認

### TypeScriptエラー

#### 型エラーが多数出る場合

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```
