# ra9 データベース移行計画

## 概要
ra8のデータベース（MySQL）から独立したra9専用のデータベースを作成し、
改善されたスキーマ設計とモダンな命名規則でデータを移行する。

## 設計方針

### 案A: 完全モダン（採用）
**TypeScript: camelCase / DB: snake_case 完全分離 + Drizzle `casing` option**

```typescript
// TypeScriptコード側
user.emailVerified
collection.createdAt

// データベース側
users.email_verified
collections.created_at
```

**実装方法**:
- `lib/db/index.ts` に `casing: 'snake_case'` option追加
- Auth.jsテーブルは手動でsnake_case指定
- アプリテーブルはcamelCaseで定義（自動変換）
- **カスタムアダプター完全削除**

### 案B: Auth.js公式厳守（フォールバック）
案Aで不具合が出た場合のフォールバック案。
Auth.js公式スキーマをそのまま使用（DB上もcamelCase）。

**切り替え手順**:
```bash
mysql -u ra8_user -ppassword -e "DROP DATABASE ra9;"
mysql -u ra8_user -ppassword -e "CREATE DATABASE ra9 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# schema.tsとauth.tsを案B用に修正してdrizzle-kit push
```

---

## 新しいスキーマ設計（案A）

### テーブル構成

#### Auth.jsテーブル（完全標準準拠）
- `users` - ユーザー情報（**UUID使用**）
- `accounts` - OAuth連携情報
- `sessions` - セッション情報（auth_sessionsから変更）
- `verification_tokens` - メール認証用（オプション）
- `authenticators` - WebAuthn用（オプション）

#### アプリケーションテーブル
- `collections` - 記念日のグループ（旧：entities）
- `anniversaries` - 個別の記念日（旧：days）

---

### users テーブル

| TypeScriptフィールド | DB列名 | 型 | 説明 | 変更内容 |
|---------------------|--------|-----|------|---------|
| id | id | varchar(255) | 主キー（UUID） | bigint AUTO_INCREMENT → varchar(255) UUID |
| name | name | varchar(255) | 名前 | - |
| email | email | varchar(255) | メール | - |
| emailVerified | email_verified | timestamp | メール認証日時 | email_verified_at → email_verified |
| image | image | text | プロフィール画像 | 新規追加 |
| createdAt | created_at | timestamp | 作成日時 | 新規追加（Auth.js標準外） |
| updatedAt | updated_at | timestamp | 更新日時 | 新規追加（Auth.js標準外） |

**削除するフィールド**:
- `password` - OAuth専用のため不要
- `google_id` - accountsテーブルで管理
- `remember_token` - Laravel互換フィールド不要

**重要な変更**:
- **idがvarchar(255) UUIDに変更** → カスタムアダプター不要
- Auth.js標準に完全準拠 → `crypto.randomUUID()` で自動生成

---

### accounts テーブル

| TypeScriptフィールド | DB列名 | 型 | 説明 |
|---------------------|--------|-----|------|
| userId | user_id | varchar(255) | FK → users.id（UUID） |
| type | type | varchar(255) | アカウント種別 |
| provider | provider | varchar(255) | プロバイダー名 |
| providerAccountId | provider_account_id | varchar(255) | プロバイダーアカウントID |
| refresh_token | refresh_token | text | リフレッシュトークン |
| access_token | access_token | text | アクセストークン |
| expires_at | expires_at | int | トークン期限 |
| token_type | token_type | varchar(255) | トークン種別 |
| scope | scope | varchar(255) | スコープ |
| id_token | id_token | varchar(2048) | IDトークン |
| session_state | session_state | varchar(255) | セッション状態 |

**主キー**: `(provider, provider_account_id)`

**注意**: OAuth標準フィールド（refresh_token等）は元からsnake_case

---

### sessions テーブル

| TypeScriptフィールド | DB列名 | 型 | 説明 | 変更内容 |
|---------------------|--------|-----|------|---------|
| sessionToken | session_token | varchar(255) | セッショントークン | - |
| userId | user_id | varchar(255) | FK → users.id（UUID） | bigint → varchar(255) |
| expires | expires | timestamp | 有効期限 | - |

**主キー**: `session_token`

**変更内容**: `auth_sessions` → `sessions`（Auth.js標準テーブル名）

---

### collections テーブル

| TypeScriptフィールド | DB列名 | 型 | 説明 | 変更内容 |
|---------------------|--------|-----|------|---------|
| id | id | bigint | 主キー | - |
| userId | user_id | varchar(255) | FK → users.id（UUID） | bigint → varchar(255) |
| name | name | varchar(255) | グループ名 | - |
| description | description | text | 説明 | desc → description |
| isVisible | is_visible | tinyint | 表示/非表示 | status → is_visible（用途明確化） |
| createdAt | created_at | timestamp | 作成日時 | - |
| updatedAt | updated_at | timestamp | 更新日時 | - |

**削除するフィールド**:
- `deleted_at` - ソフトデリートを廃止、物理削除に変更

**重要**: `casing: 'snake_case'` により自動変換される

---

### anniversaries テーブル

| TypeScriptフィールド | DB列名 | 型 | 説明 | 変更内容 |
|---------------------|--------|-----|------|---------|
| id | id | bigint | 主キー | - |
| collectionId | collection_id | bigint | FK → collections.id | entity_id → collection_id |
| name | name | varchar(255) | 記念日名 | - |
| description | description | text | 説明 | desc → description |
| anniversaryDate | anniversary_date | date | 記念日（DATE型） | anniv_at → anniversary_date |
| createdAt | created_at | timestamp | 作成日時 | - |
| updatedAt | updated_at | timestamp | 更新日時 | - |

**削除するフィールド**:
- `deleted_at` - ソフトデリートを廃止、物理削除に変更

**重要**: `casing: 'snake_case'` により自動変換される

---

## 変更の理由

### データベース名
- `ra9_db` → `ra9`: シンプルで一貫性のある命名

### 命名規則の完全分離
- **TypeScript側**: camelCase（JavaScript/TypeScript標準）
  - `user.emailVerified`, `collection.createdAt`
- **データベース側**: snake_case（SQL標準）
  - `users.email_verified`, `collections.created_at`
- **Drizzle `casing` option** で自動変換
  - モダンなTypeScript開発の標準手法（2025年）
  - 各言語の慣習を尊重

### テーブル名
- `entities` → `collections`: より明確な命名、記念日のコレクションという意図
- `days` → `anniversaries`: 記念日アプリとして意味が明確、日本語でも理解しやすい
- `auth_sessions` → `sessions`: Auth.js v5の標準テーブル名

### フィールド名
- `desc` → `description`: SQL予約語（DESC）との衝突回避、可読性向上
- `anniv_at` → `anniversaryDate`:
  - 略語の排除（anniv → anniversary）
  - `_at`はtimestamp用、DATE型には不適切
  - DATE型なので`Date`サフィックスが適切
- `entity_id` → `collectionId`: 親テーブル名に合わせる
- `status` → `isVisible`: 用途を明確化（表示/非表示フラグ）
- `email_verified_at` → `emailVerified`: Auth.js標準

### ソフトデリート廃止
- `deleted_at`を削除して物理削除に変更
- 理由：
  - ユーザー情報以外は復元の必要性が低い
  - クエリがシンプルになる（`WHERE deleted_at IS NULL` 不要）
  - インデックス不要でパフォーマンス向上

### Auth.js完全準拠
- **users.id が varchar(255) UUID** → カスタムアダプター不要
- 標準DrizzleAdapterをそのまま使用可能
- Auth.js v5の将来のアップデートに対応しやすい

---

## 実装手順

### 1. データベース作成（✅完了）

```bash
mysql -u ra8_user -ppassword -e "CREATE DATABASE ra9 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. lib/db/index.ts 更新

`casing: 'snake_case'` optionを追加：

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
export const db = drizzle(connection, {
  casing: 'snake_case',  // ← 追加
});
```

### 3. lib/db/schema.ts 更新

#### Auth.jsテーブル（手動でsnake_case指定）

```typescript
// usersテーブル
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),  // UUID自動生成
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),  // 手動でsnake
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),  // 手動でsnake
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().onUpdateNow(),  // 手動でsnake
});

// accountsテーブル
export const accounts = mysqlTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 255 })  // 手動でsnake
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),  // 手動でsnake
    refresh_token: text("refresh_token"),  // 元からsnake
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// sessionsテーブル（auth_sessionsから変更）
export const sessions = mysqlTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),  // 手動でsnake
  userId: varchar("user_id", { length: 255 })  // 手動でsnake
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});
```

#### アプリテーブル（camelCaseで定義、自動変換）

```typescript
// collectionsテーブル（旧entities）
export const collections = mysqlTable(
  "collections",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    userId: varchar("userId", { length: 255 })  // ← camelCase、DB側は自動でuser_idに変換
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),  // desc → description
    isVisible: tinyint("isVisible", { unsigned: true }).notNull().default(0),  // status → isVisible
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),  // 自動でcreated_atに変換
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().onUpdateNow(),  // 自動でupdated_atに変換
    // deleted_at削除
  },
  (table) => ({
    userIdIdx: index("collections_user_id_index").on(table.userId),
  })
);

// anniversariesテーブル（旧days）
export const anniversaries = mysqlTable(
  "anniversaries",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    collectionId: bigint("collectionId", { mode: "number", unsigned: true })  // 自動でcollection_idに変換
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),  // desc → description
    anniversaryDate: date("anniversaryDate", { mode: "string" }).notNull(),  // anniv_at → anniversaryDate
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().onUpdateNow(),
    // deleted_at削除
  },
  (table) => ({
    collectionIdIdx: index("anniversaries_collection_id_index").on(table.collectionId),
  })
);

// Relations更新
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  anniversaries: many(anniversaries),
}));

export const anniversariesRelations = relations(anniversaries, ({ one }) => ({
  collection: one(collections, {
    fields: [anniversaries.collectionId],
    references: [collections.id],
  }),
}));

// 型定義更新
export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Anniversary = typeof anniversaries.$inferSelect;
```

### 4. auth.ts 更新（カスタムアダプター削除）

```typescript
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/db/schema";  // authSessions → sessions

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,  // authSessions → sessions
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
});
```

**重要な変更**:
- カスタムアダプター完全削除
- 標準DrizzleAdapterをそのまま使用
- `authSessions` → `sessions`

### 5. lib/db/queries.ts 更新

```typescript
import { db } from "@/lib/db";
import { collections, anniversaries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// collectionsクエリ
export const collectionQueries = {
  async getAll(userId: string) {
    return db.query.collections.findMany({
      where: eq(collections.userId, userId),  // deleted_at条件削除
      with: {
        anniversaries: true,
      },
    });
  },

  async getById(id: number, userId: string) {
    return db.query.collections.findFirst({
      where: (collections, { eq, and }) =>
        and(eq(collections.id, id), eq(collections.userId, userId)),
      with: {
        anniversaries: true,
      },
    });
  },
};

// anniversariesクエリ
export const anniversaryQueries = {
  async getAll(userId: string) {
    return db.query.anniversaries.findMany({
      where: (anniversaries, { eq, and }) =>
        and(
          eq(anniversaries.collection.userId, userId)
        ),
      with: {
        collection: true,
      },
    });
  },
};
```

### 6. Server Actions 更新

- `app/actions/entities.ts` → `app/actions/collections.ts`
- `app/actions/days.ts` → `app/actions/anniversaries.ts`
- ソフトデリート削除（物理削除に変更）
- フィールド名更新（TypeScript側はcamelCase）

### 7. ページ・コンポーネント 更新

- 全インポート文更新（Entity → Collection, Day → Anniversary）
- フィールドアクセス更新（entity.desc → collection.description）
- 型定義更新

### 8. 環境変数更新

`.env.local`:
```
DATABASE_URL="mysql://ra8_user:password@127.0.0.1:3306/ra9"
```

### 9. Drizzle Pushでスキーマ適用

```bash
npx drizzle-kit push
```

### 10. 動作確認

- [ ] ログイン（Google OAuth）
- [ ] Collection作成・編集・削除
- [ ] Anniversary作成・編集・削除
- [ ] 記念日一覧表示
- [ ] カウントダウン表示

---

## データ移行（本番のみ実行）

開発環境ではデータ移行不要（新規作成）。
本番環境でのみ以下のSQLを実行：

```sql
USE ra9;

-- usersテーブル（bigint id → UUID変換）
-- 注意: ra8のユーザーIDとUUIDのマッピングテーブルを別途作成する必要あり
-- 実装時に詳細な移行スクリプトを作成

-- collections（旧：entities）
INSERT INTO collections (id, user_id, name, description, is_visible, created_at, updated_at)
SELECT id, user_id, name, desc, 1, created_at, updated_at
FROM ra8.entities
WHERE deleted_at IS NULL;

-- anniversaries（旧：days）
INSERT INTO anniversaries (id, collection_id, name, description, anniversary_date, created_at, updated_at)
SELECT d.id, d.entity_id, d.name, d.desc, d.anniv_at, d.created_at, d.updated_at
FROM ra8.days d
JOIN ra8.entities e ON d.entity_id = e.id
WHERE d.deleted_at IS NULL AND e.deleted_at IS NULL;
```

**注意**: users.idがbigint → UUIDに変更されるため、複雑な移行が必要。
本番移行時に詳細な移行スクリプトを別途作成。

---

## メリット

✅ TypeScript/SQLそれぞれの慣習を尊重
✅ Drizzle `casing` optionでモダンな開発体験
✅ Auth.js v5標準に完全準拠（カスタムアダプター不要）
✅ シンプルで分かりやすい命名
✅ SQL予約語との衝突完全回避
✅ ra8と独立した開発環境
✅ 不要なソフトデリート削除でコード簡潔化
✅ 5年後に見ても意図が明確

---

## 注意事項

### 案Aで不具合が発生した場合

以下の手順で案B（Auth.js公式厳守）に切り替え：

```bash
# ra9をリセット
mysql -u ra8_user -ppassword -e "DROP DATABASE ra9;"
mysql -u ra8_user -ppassword -e "CREATE DATABASE ra9 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# schema.tsとauth.tsを案B用に修正
# - Auth.jsテーブル: DB上もcamelCase（公式そのまま）
# - lib/db/index.ts: casing option削除
# - アプリテーブル: 完全snake_caseまたは完全camelCase統一

# 再度push
npx drizzle-kit push
```

### その他
- ra8は引き続き動作するため、並行運用可能
- データ移行後もra8のデータは保持される
- ra9で問題があればra8に戻すことも可能
- 移行完了後にra8のデータベースバックアップ推奨

---

## スケジュール（目安）

1. ドキュメント更新: ✅ 完了
2. スキーマ・認証コード更新: 1-2時間
3. クエリ・Actions更新: 1時間
4. UI更新: 1-2時間
5. スキーマ適用・動作確認: 1時間
6. （本番のみ）データ移行: 要設計

**合計（開発環境）:** 約4-6時間
