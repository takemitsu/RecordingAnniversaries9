# Passkey（WebAuthn）実装プラン

## 関連ドキュメント

このドキュメントは技術実装の詳細を記載しています。
UI/UXフローについては **[PASSKEY_UX_FLOW.md](./PASSKEY_UX_FLOW.md)** を参照してください。

---

## 現状分析（2025-11-06）

### ✅ 完了済み
- Auth.js v5 (next-auth@5.0.0-beta.30) 導入済み
- Google OAuth認証実装済み
- Drizzle ORM + MySQL環境構築済み
- `@auth/drizzle-adapter` v1.11.1（WebAuthn対応バージョン）
- Database strategy使用中

### ❌ 未実装
- Passkey（WebAuthn）認証機能
- Authenticatorテーブル
- `@simplewebauthn/server`, `@simplewebauthn/browser` パッケージ
- Passkeyサインイン/登録UI

## 実装方針

**Auth.js v5のWebAuthn Provider**を採用（方針A）

### 採用理由
1. Auth.js v5公式のWebAuthnサポート（実験的だが方向性明確）
2. 既存のAuth.jsインフラと統合
3. 2025年時点での最新標準
4. Drizzle Adapterが既に対応済み（v1.11.1）
5. 将来の移行コストが最小

### ⚠️ 重要な注意事項
- **実験的機能**（Auth.js公式が本番環境未推奨と警告）
- 将来的にAPIが変更される可能性あり
- 本番環境での使用は自己責任
- Auth.jsの更新を定期的に追跡する必要あり

## 実装の全体像

### Phase 1: 環境準備とDB変更
1. パッケージインストール
2. Authenticatorテーブル追加
3. Drizzleマイグレーション実行

### Phase 2: Auth.js設定
1. WebAuthn Providerを有効化
2. experimental flagを追加
3. Authenticatorテーブルをアダプターに登録

### Phase 3: UI実装
1. サインインページにPasskey対応ボタン追加
2. 設定ページ（Passkey管理）追加

### Phase 4: テスト
1. ユニットテスト（Zodスキーマ）
2. Integration Tests（Server Actions）
3. E2Eテスト（Playwright）

### Phase 5: ドキュメント更新
1. CLAUDE.md更新
2. SETUP.md更新
3. TODO.md更新

## 詳細な実装ステップ

### Step 1: 依存関係のインストール

```bash
npm install @simplewebauthn/browser@9.0.1 @simplewebauthn/server@9.0.3
```

### Step 2: Authenticatorテーブル定義

`lib/db/schema.ts`に追加:

```typescript
export const authenticators = mysqlTable(
  "authenticators",
  {
    credentialID: varchar("credential_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    credentialPublicKey: varchar("credential_public_key", { length: 255 }).notNull(),
    counter: int("counter").notNull(),
    credentialDeviceType: varchar("credential_device_type", { length: 255 }).notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: varchar("transports", { length: 255 }),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

// リレーション追加
export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

// 型エクスポート追加
export type Authenticator = typeof authenticators.$inferSelect;
export type NewAuthenticator = typeof authenticators.$inferInsert;
```

**注意点**:
- `credentialID`はBase64エンコードされた文字列（255文字で十分）
- `.unique()`は不要（composite PKで一意性確保）
- `credentialPublicKey`は`varchar(255)`（Auth.js公式実装と一致）
- `credentialDeviceType`も`varchar(255)`（32→255に変更）
- `counter`はリプレイアタック防止用
- `credentialBackedUp`は`boolean()`型（DrizzleがMySQLで`TINYINT(1)`にマップ）
- `transports`はJSON文字列（例: `["internal","hybrid"]`）

**Auth.js公式実装準拠**:
このスキーマはAuth.js公式のDrizzle Adapter実装と完全に一致しています。

### Step 3: Drizzleマイグレーション

```bash
# マイグレーションファイル生成
npx drizzle-kit generate

# マイグレーション実行（開発環境）
npm run db:migrate

# テストDB用マイグレーション
TEST_DATABASE_URL="mysql://..." npx drizzle-kit migrate
```

### Step 4: Auth.js設定変更

`auth.ts`を更新:

```typescript
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Passkey from "next-auth/providers/passkey";
import { db } from "@/lib/db";
import { accounts, authenticators, sessions, users } from "@/lib/db/schema";

export const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    authenticatorsTable: authenticators, // 追加
  }),
  debug: true,
  useSecureCookies: false, // E2Eテスト対応
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Passkey, // 追加
  ],
  experimental: {
    enableWebAuthn: true, // 追加
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
```

### Step 5: サインインページUI更新

#### 重要: Passkey登録とログインの違い

WebAuthnには2つの異なるフローがあります：

1. **Passkey作成（登録）**: `signIn("passkey", { action: "register" })`
   - 新しいPasskeyを作成（初回のみ）
   - デバイスに生体認証情報を保存
   - 通常はプロフィールページで実行

2. **Passkeyでログイン**: `signIn("passkey")`
   - 既存のPasskeyで認証
   - サインインページで実行

**UX設計**:
- サインインページ: 既存Passkeyでログイン
- プロフィールページ: Passkey作成ボタン（Google認証後）

---

#### オプション1: Auth.jsビルトインページ使用（推奨・最も簡単）

Auth.jsのビルトインページを使う場合、`pages.signIn`を削除すれば自動でPasskeyボタンが表示される。

`auth.ts`を更新:
```typescript
pages: {
  // signIn: "/auth/signin", // コメントアウト（削除）
  error: "/auth/error",
},
```

この場合、`/api/auth/signin`にアクセスするとPasskeyボタン付きのページが表示される。

**メリット**:
- コード不要
- Auth.jsが自動でPasskey UIを生成
- メンテナンスが楽

**デメリット**:
- デザインカスタマイズが制限される
- 既存の `/auth/signin` ページは使われなくなる

#### オプション2: カスタムページ（完全コントロール）

既存の`app/auth/signin/page.tsx`を改造してPasskeyボタンを追加する。

**重要**: Auth.jsのPasskey Providerを使う場合、Server Actionで`signIn("passkey")`を呼び出すだけ。`@simplewebauthn/browser`を直接使う必要はない。

`app/auth/signin/page.tsx`を更新:

```typescript
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function SignInPage() {
  const session = await auth();

  // 既にログイン済みの場合はメインページへ
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recording Anniversaries
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Passkey ボタン */}
          <form
            action={async () => {
              "use server";
              await signIn("passkey", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              🔑 Passkeyでログイン
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                または
              </span>
            </div>
          </div>

          {/* Google OAuth ボタン */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Google"
              >
                {/* Google SVG paths */}
              </svg>
              Googleでログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**メリット**:
- 既存デザインを維持
- Server Componentのまま（Reactのハイドレーション不要）
- シンプルな実装

**注意**:
- Server Actionで`signIn("passkey")`を呼び出す
- Client Componentにする必要はない
- `@simplewebauthn/browser`は内部でAuth.jsが使用

#### オプション3: Client Component版（`next-auth/webauthn`使用）

より柔軟な実装が必要な場合、Client Componentで`next-auth/webauthn`を使用できます。

`app/auth/signin/page.tsx`:

```typescript
"use client";

import { signIn } from "next-auth/webauthn";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recording Anniversaries
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Passkey ボタン */}
          <button
            onClick={() => signIn("passkey")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            🔑 Passkeyでログイン
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                または
              </span>
            </div>
          </div>

          {/* Google OAuth ボタン */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Google"
              >
                {/* Google SVG paths */}
              </svg>
              Googleでログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

**メリット**:
- クライアント側での柔軟な制御
- エラーハンドリングがしやすい

**デメリット**:
- Client Componentが必要
- Reactのハイドレーションが発生

**比較表**:

| 項目 | オプション1（ビルトイン） | オプション2（Server Action） | オプション3（Client Component） |
|------|-------------------------|----------------------------|--------------------------------|
| 実装難易度 | ⭐⭐⭐⭐⭐ 最も簡単 | ⭐⭐⭐⭐ 簡単 | ⭐⭐⭐ 中程度 |
| カスタマイズ | ❌ 制限あり | ✅ 可能 | ✅ 柔軟 |
| ハイドレーション | ✅ なし | ✅ なし | ❌ あり |
| エラー制御 | ❌ 制限あり | ⚠️ Server側のみ | ✅ クライアント側で可能 |
| 推奨度 | 🥇 プロトタイプ | 🥈 本番推奨 | 🥉 高度な制御が必要な場合 |

### Step 6: Passkey管理機能実装

#### 6.1 Server Actions追加

`app/actions/authenticators.ts`を新規作成:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { authenticators } from "@/lib/db/schema";
import { getUserId } from "@/lib/auth-helpers";

export async function getAuthenticators() {
  const userId = await getUserId();

  const userAuthenticators = await db
    .select()
    .from(authenticators)
    .where(eq(authenticators.userId, userId));

  return userAuthenticators;
}

export async function deleteAuthenticator(credentialID: string) {
  const userId = await getUserId();

  await db
    .delete(authenticators)
    .where(
      and(
        eq(authenticators.credentialID, credentialID),
        eq(authenticators.userId, userId)
      )
    );

  revalidatePath("/profile");
  return { success: true };
}
```

**注意**:
- `getUserId()`で認証チェック（既存パターンと同じ）
- `userId`はServer Action内で取得（引数で受け取らない）
- 権限チェックを確実に実行

#### 6.2 プロフィールページUI更新

`app/(main)/profile/page.tsx`にPasskey管理セクションを追加:

```typescript
import { getAuthenticators, deleteAuthenticator } from "@/app/actions/authenticators";

export default async function ProfilePage() {
  const authenticators = await getAuthenticators();

  return (
    <div>
      {/* 既存のプロフィールフォーム */}

      {/* Passkey管理セクション追加 */}
      <section className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Passkey設定</h2>

        {/* Passkey作成ボタン（重要！） */}
        <div className="mb-4">
          <form
            action={async () => {
              "use server";
              await signIn("passkey", { action: "register" });
            }}
          >
            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔑 新しいPasskeyを作成
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            このデバイスの生体認証（Touch ID、Face IDなど）でログインできるようになります
          </p>
        </div>

        {/* 登録済みPasskey一覧 */}
        <div>
          <h3 className="font-semibold mb-2">登録済みPasskey</h3>
          {authenticators.length === 0 ? (
            <p className="text-gray-500">Passkeyが登録されていません</p>
          ) : (
            <ul className="space-y-2">
              {authenticators.map((auth) => (
                <li
                  key={auth.credentialID}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div>
                    <span className="font-medium">{auth.credentialDeviceType}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {auth.credentialBackedUp ? "☁️ バックアップ済み" : "📱 このデバイスのみ"}
                    </span>
                  </div>
                  <form action={deleteAuthenticator.bind(null, auth.credentialID)}>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600"
                    >
                      削除
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
```

**重要**: `signIn("passkey", { action: "register" })`を使用してPasskey作成を実行。

### Step 7: テスト実装

#### 7.1 スキーマテスト

`__tests__/lib/schemas/authenticator.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { authenticators } from "@/lib/db/schema";

describe("Authenticator Schema", () => {
  it("should have correct table name", () => {
    expect(authenticators).toBeDefined();
  });

  // 型チェックテスト
  it("should infer correct types", () => {
    type Authenticator = typeof authenticators.$inferSelect;
    type NewAuthenticator = typeof authenticators.$inferInsert;

    const auth: NewAuthenticator = {
      credentialID: "test-credential-id",
      userId: "test-user-id",
      providerAccountId: "test-provider-account-id",
      credentialPublicKey: "test-public-key",
      counter: 0,
      credentialDeviceType: "singleDevice",
      credentialBackedUp: 0,
      transports: "internal",
    };

    expect(auth).toBeDefined();
  });
});
```

#### 7.2 E2Eテスト

**重要**: PlaywrightでのWebAuthn自動テストは非常に複雑で、実用的ではありません。

**推奨アプローチ**:
1. **手動テスト**を優先（実デバイスで確認）
2. E2Eテストは基本UIの存在確認のみ

```typescript
// e2e/passkey.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Passkey UI", () => {
  test("should show passkey button on signin page", async ({ page }) => {
    await page.goto("/auth/signin");

    // Passkeyボタンの存在確認（クリックはしない）
    const passkeyButton = page.getByRole("button", { name: /passkey/i });
    await expect(passkeyButton).toBeVisible();
  });
});
```

**手動テストチェックリスト**:
- [ ] Passkey登録（Chrome/Edge、Safari、Firefox）
- [ ] Passkey認証（複数デバイス）
- [ ] Passkey削除
- [ ] デバイス紛失時のフォールバック（Google OAuth）
- [ ] Cross-device Passkey（QRコード経由）

**Playwright VirtualAuthenticator APIについて**:
- Chromium系のみ対応
- 設定が複雑
- 本番環境との乖離が大きい
- **実装は後回し推奨**

### Step 8: ドキュメント更新

#### CLAUDE.md更新

```markdown
### 認証
- ✅ Auth.js v5 設定
- ✅ Google OAuth プロバイダー設定
- ✅ **Passkey（WebAuthn）認証** - ⚠️ 実験的機能
  - Auth.js v5のWebAuthn Provider使用
  - Authenticatorテーブル実装済み
  - Google OAuthと並行運用
  - 本番環境では要検証
- ✅ セッション管理（database strategy）
```

#### SETUP.md更新

環境変数セクションに追加（必要なら）:

```markdown
### WebAuthn設定（オプション）

Passkeyを使用するには:
- HTTPS接続が必須（本番環境）
- 開発環境では `localhost` で動作
```

#### TODO.md更新

```markdown
### 認証
- ✅ Passkey（WebAuthn）実装
  - Auth.js v5のWebAuthn Provider使用
  - ⚠️ 実験的機能（本番環境での検証必要）
  - `@simplewebauthn/server@9.0.3`, `@simplewebauthn/browser@9.0.1` 使用
  - Authenticatorテーブル実装済み
```

## WebAuthn ベストプラクティス

### 2025年標準に準拠

#### 1. Conditional UI
- ブラウザがPasskeyをサポートしているか確認してからボタン表示
- Auth.jsはデフォルトで `enableConditionalUI: true`

#### 2. HTTPS必須
- 本番環境では必ずHTTPS使用
- 開発環境では `localhost` で動作

#### 3. excludeCredentials
- 既存Passkeyの上書き防止
- Auth.jsが自動処理

#### 4. フォールバック
- Google OAuthを残す（推奨）
- デバイス紛失時の復旧手段

#### 5. ユーザー体験
- 「Passkey」という用語を使用（「パスキー」でもOK）
- 登録フローは明確に
- 設定ページで管理可能にする

## セキュリティ考慮事項

### CVE-2025-29927対応
- middleware認証は使わない（既に使っていない）
- Server Actionsで認証チェック（既に実装済み）
- Data Access Layer使用（`lib/db/queries.ts`で実装済み）

### Passkey固有
- リプレイアタック防止: `counter`フィールド使用
- フィッシング防止: オリジン検証（WebAuthn標準）
- 中間者攻撃防止: HTTPS必須

## 既知の制限事項

### Auth.js v5 WebAuthn Provider
1. **実験的機能** - 本番環境未推奨（公式警告）
2. **ブラウザサポート**
   - Chrome/Edge: ✅
   - Safari: ✅ (iOS 16+, macOS Ventura+)
   - Firefox: ✅
3. **デバイス要件**
   - Touch ID, Face ID, Windows Hello, Android Biometrics
   - または USB セキュリティキー

### Playwright E2Eテスト
- WebAuthn APIのモックが困難
- 実デバイスでの手動テスト推奨
- または Playwright の `VirtualAuthenticator` API使用（複雑）

## トラブルシューティング

### Passkey登録/認証が失敗する

#### チェック項目
1. HTTPSか（本番環境）または`localhost`か（開発環境）
2. ブラウザがWebAuthnをサポートしているか
3. デバイスに生体認証が設定されているか
4. `authenticators`テーブルが作成されているか
5. `experimental.enableWebAuthn`が`true`か

#### デバッグ方法
```typescript
// auth.ts
debug: true, // 既に設定済み
```

ブラウザコンソールでWebAuthn APIを確認:
```javascript
console.log("WebAuthn available:", window.PublicKeyCredential !== undefined);
```

### マイグレーションエラー

```bash
# スキーマ確認
npx drizzle-kit introspect

# マイグレーション再実行
npx drizzle-kit drop  # 注意: データ削除
npx drizzle-kit generate
npm run db:migrate
```

### ビルドエラー

```bash
# 型チェック
npx tsc --noEmit

# 依存関係確認
npm list @simplewebauthn/server @simplewebauthn/browser
```

## 参考リソース

### 公式ドキュメント
- [Auth.js v5 Passkey](https://authjs.dev/getting-started/providers/passkey)
- [Auth.js WebAuthn Reference](https://authjs.dev/reference/core/providers/webauthn)
- [Auth.js Drizzle Adapter (MySQL)](https://authjs.dev/reference/drizzle-adapter/lib/mysql)
- [SimpleWebAuthn Server](https://simplewebauthn.dev/docs/packages/server)
- [SimpleWebAuthn Browser](https://simplewebauthn.dev/docs/packages/client)
- [W3C WebAuthn Spec](https://www.w3.org/TR/webauthn/)
- [MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

### 確認済みソースコード
- [Drizzle Adapter MySQL Schema](https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-drizzle/src/lib/mysql.ts)
- [WebAuthn Provider Implementation](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/webauthn.ts)

### コミュニティ
- [Auth.js GitHub Discussions](https://github.com/nextauthjs/next-auth/discussions)
- [SimpleWebAuthn GitHub](https://github.com/MasterKale/SimpleWebAuthn)

### 確認済みIssue
- [Next.js 16 互換性](https://github.com/nextauthjs/next-auth/issues/13302) - ✅ beta.30で解決済み

## 実装の優先順位

### Phase 1: 環境準備（必須）
- [x] 調査完了
- [x] 実装プラン作成
- [ ] パッケージインストール（`@simplewebauthn/*`）
- [ ] Authenticatorテーブル追加（`lib/db/schema.ts`）
- [ ] Drizzleマイグレーション実行
- [ ] `auth.ts`更新（Authenticatorテーブル登録）

### Phase 2: 基本機能（必須）
- [ ] Auth.js設定更新（Passkey Provider追加）
- [ ] サインインページ更新（オプション1または2を選択）
- [ ] 手動テスト（Passkey登録・認証）

### Phase 3: 管理機能（推奨）
- [ ] Server Actions実装（`app/actions/authenticators.ts`）
- [ ] プロフィールページにPasskey管理UI追加
- [ ] スキーマテスト追加
- [ ] 手動テスト（Passkey削除）

### Phase 4: テスト・改善（オプション）
- [ ] E2E基本テスト追加（UI存在確認のみ）
- [ ] エラーハンドリング強化
- [ ] Conditional UI確認

### Phase 5: ドキュメント（必須）
- [ ] CLAUDE.md更新
- [ ] SETUP.md更新（必要なら）
- [ ] TODO.md更新
- [ ] 本番環境での動作確認チェックリスト

## 技術的確認事項

### Next.js 16 対応状況

✅ **現在のプロジェクトは問題なし**
- `next-auth@5.0.0-beta.30`を使用中
- Next.js 16.0.1で動作確認済み
- [Issue #13302](https://github.com/nextauthjs/next-auth/issues/13302)（互換性問題）はbeta.30で解決済み

**注意点**:
- このプロジェクトはミドルウェア認証を使わない設計（Server Actions使用）
- ミドルウェア使用時は`proxy`形式に変更が必要

### SimpleWebAuthn 9.0.3

✅ **API変更なし**
- 9.0.1から9.0.3へのマイナーアップデート
- 破壊的変更なし
- Auth.js公式推奨バージョン

### 環境変数について

✅ **Relying Party設定は環境変数不要**

Auth.jsが自動的にリクエストURLから取得：
- `id`: `url.hostname`（例: localhost）
- `name`: `url.host`（例: localhost:3000）
- `origin`: `url.origin`（例: http://localhost:3000）

カスタマイズが必要な場合のみ、`Passkey`プロバイダーで`relayingParty`オプションを指定。

## 実装後のNext Steps

1. **本番デプロイ前**
   - 実デバイスでの動作確認（iOS, Android, Windows）
   - HTTPS設定確認
   - Auth.js公式の更新チェック

2. **本番デプロイ後**
   - ユーザーフィードバック収集
   - Auth.js v5の安定版リリース監視
   - 必要に応じてAPIアップデート

3. **将来的な改善**
   - レート制限追加（`upstash/ratelimit`）
   - Passkey登録時のオンボーディングUI改善
   - 複数Passkeyの管理機能強化

---

**最終更新**: 2025-11-06（レビュー反映版）
**作成者**: Claude Code
**レビュアー**: Claude Code（別セッション）
**ステータス**: 実装待ち（Phase 1開始可能）
