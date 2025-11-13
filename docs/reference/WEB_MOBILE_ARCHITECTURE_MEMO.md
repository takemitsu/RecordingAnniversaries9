# Web/Mobile アーキテクチャ メモ

このドキュメントは、Web アプリと Mobile アプリを統合する際の技術選定や設計パターンについての雑談メモです。
「こうしなければならない」というよりは「こういう選択肢がある」という感じで読んでください。

## Route Groups について

### Route Groups とは

Next.js の公式機能。フォルダ名を括弧で囲む `(folderName)` ことで、**URL パスに含まれない論理的なグループ**を作れる。

```
app/
  (main)/           ← Route Group（URL に含まれない）
    page.tsx        → URL: /
    edit/
      page.tsx      → URL: /edit
    layout.tsx      → このグループ専用のレイアウト
  auth/             ← 通常のフォルダ（URL に含まれる）
    signin/
      page.tsx      → URL: /auth/signin
```

### 使用例

**このプロジェクト**:
```
app/
  (main)/          ← 認証後のメインアプリ
    layout.tsx     → Header/Footer 付きレイアウト
    page.tsx
    edit/
    profile/
  auth/            ← 認証ページ
    signin/        → Header/Footer なし
```

### 標準・ベスト・プラクティスか？

- ✅ **公式機能**: Next.js 13+ App Router の正式機能
- ✅ **標準**: 公式ドキュメントに記載
- △ **ベスト・プラクティス**: レイアウト分離が必要なときは推奨（必須ではない）
- △ **デファクト・スタンダード**: よく使われるが、全プロジェクトで必須というわけではない

### 命名

- `(main)` は予約語ではなく、適当につけた名前
- `()` 内は何でもいいが、パス重複は禁止
- 公式ドキュメントでは `(marketing)` `(shop)` などが例として挙げられている
- 実際には **(auth)** 以外はあまり使われていない

### 主流の使用例

- **(auth)** - 認証ページ（最も一般的）
- **(dashboard)** - 管理画面、アナリティクス
- **(marketing)** - 公開ページ（about, contact など）
- **(shop)** - EC サイトの商品ページ
- **(admin)** - 管理者専用ページ
- **(app)** や **(main)** - メインアプリケーション

---

## 管理画面の作り方

### パターン1: 同じプロジェクト内で `/admin`（最も一般的）✅

```
app/
├── (admin)/
│   ├── layout.tsx      # 管理画面専用レイアウト
│   ├── dashboard/
│   └── users/
├── (main)/
│   ├── layout.tsx      # ユーザー向けレイアウト
│   └── page.tsx
```

**メリット**:
- シンプル、デプロイ1回でOK
- 1つのコミットで全体を変更できる
- Drizzle schema、共通コードの共有が簡単
- 1つの `DATABASE_URL` で済む

**デメリット**:
- 認可（権限管理）をちゃんと実装する必要がある
- デプロイが一緒（管理画面の変更でユーザー側も再デプロイ）

### パターン2: プロジェクトを分ける（モノレポ）

```
monorepo/
├── apps/
│   ├── user-app/       # ユーザー向け Next.js
│   └── admin-app/      # 管理画面 Next.js
├── packages/
│   ├── database/       # Drizzle schema 共有
│   └── ui/            # 共通UIコンポーネント
├── pnpm-workspace.yaml
└── turbo.json
```

**メリット**:
- 独立したデプロイ（リリースサイクルが違う場合に有効）
- アクセス制御（管理画面のコードを全員に見せたくない場合）
- スケールしやすい

**デメリット**:
- 複雑（Turborepo、pnpm workspaces の理解が必要）
- 共通コードの変更が面倒（2つのアプリでテストが必要）
- デプロイが2回必要

### どっちが多い？

**圧倒的に「同じプロジェクト内で `/admin` ルート」が多い**

使い分けの目安：
- **同じプロジェクト**: スタートアップ、中小規模、5人以下のチーム
- **モノレポ**: エンタープライズ、大規模、別チーム、10人以上

---

## 管理画面のセキュリティと認証

### セキュリティは担保できるのか？

**できる。ただし作り方次第** ✅

SSR（Next.js）の強み：**コード自体がクライアントに送信されない** → 真のセキュリティ

```typescript
// Server Component
export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/");
  }

  // このコードはクライアントに送信されない ✅
  const sensitiveData = await db.select().from(users);
  return <AdminUI data={sensitiveData} />;
}
```

SPA（React）の弱点：**JS ファイルに全コードが含まれる** → DevTools で見れる

### Admin 認証の実装

**同じ users テーブルに `role` カラムを追加するのが標準** ✅

```typescript
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).default("user"), // 追加
});
```

**Auth.js 設定**:
```typescript
export const { handlers, auth } = NextAuth({
  callbacks: {
    session({ session, user }) {
      session.user.role = user.role;
      return session;
    },
  },
});
```

**Server Actions で権限チェック**:
```typescript
export async function deleteAnyUser(userId: string) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  // 削除処理
}
```

### role=admin のユーザーは通常機能を使えるのか？

**使える（これが一般的）** ✅

Admin = スーパーユーザー（通常機能 + 管理機能の両方使える）

**ナビゲーション例**:
```typescript
// Header.tsx
<nav>
  {/* 全員に表示 */}
  <a href="/">Home</a>
  <a href="/edit">Edit</a>

  {/* Admin のみ追加で表示 */}
  {session?.user?.role === "admin" && (
    <a href="/admin">Admin</a>
  )}
</nav>
```

### `/admin` パスの問題と対策

攻撃者の自動スキャンツールが試すパス：
```
/admin
/admin/login
/administrator
/wp-admin
```

**対策パターン**:

**パターンA: nginx で `/admin` を404にする**
```nginx
location /admin {
    return 404;
}

location /__ra9_admin_2025 {
    allow YOUR_HOME_IP;
    deny all;
    proxy_pass http://localhost:3000;
}
```

**パターンB: Rate Limiting**
```nginx
limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/m;

location /admin {
    limit_req zone=admin burst=10;
    proxy_pass http://localhost:3000;
}
```

個人プロジェクトなら **nginx + 難読化パス + IP制限** が最もコスパ良い。

---

## SSR → SPA → SSR の歴史

### 第1世代: SSR (2000年代) - PHP, Rails, JSP

```
ブラウザ  ← HTML ← サーバー（全部レンダリング）
```

**利点**: SEO 完璧、初期表示速い、シンプル
**欠点**: ページ遷移で全リロード（白い画面）、インタラクティブ性低い

### 第2世代: SPA + API (2010年代) - React, Vue, Angular

```
ブラウザ（React） ← JSON ← API サーバー
     ↑
  4.5MB JS bundle
```

**利点**: ユーザー体験が最高（スムーズ、高速遷移）、インタラクティブ
**欠点**:
- JavaScript バンドルが巨大化（実例: 4.5MB）
- SEO が弱い（初期 HTML がほぼ空っぽ）
- Hydration が重い（Time-To-Interactive が遅い）
- セキュリティ問題（全コードがクライアントに送信される）

### 第3世代: Modern SSR (2020年代) - Next.js, Remix

```
サーバー（React Server Components）
   ↓
ブラウザ（必要な部分だけ JS）
```

**利点**:
- ✅ SEO 完璧（HTML が最初から存在）
- ✅ 初期表示速い（LCP, FCP）
- ✅ JavaScript 最小限
- ✅ インタラクティブ性も保持
- ✅ セキュリティ（Server Actions）
- ✅ UX も良い（Streaming SSR）

### なぜ戻ってきたのか？

SPA の問題が明確になった：
- パフォーマンス: Core Web Vitals で測定可能に
- SEO: Google のランキング要因に
- モバイル: 低スペック端末で遅すぎる

技術の進化：
- React 19: Server Components が標準に
- Streaming SSR: Suspense で部分的に送信
- Selective Hydration: 必要な部分だけ Hydrate

### また戻るのか？

**おそらく戻らない。これが「最終形態」に近い**

振り子じゃなくて「螺旋」で進化している：
- 2000年代の SSR: HTML だけ
- 2010年代の SPA: JS だけ
- 2020年代の SSR: **HTML + 必要最小限の JS**

### 最終形態の正しい理解

```
SSR (ベース)
  ├─ Server Components（大部分）
  ├─ Client Components（SPA的な部分を内包）
  └─ データ取得:
      ├─ Server Actions（API不要パターン）
      └─ REST/GraphQL API（必要なら）
```

**SSR がベース**: HTML生成、SEO、初期表示
**SPA を内包**: Client Components で UX 向上
**データ取得**: Server Actions（シンプル）or API（マルチプラットフォーム）

---

## Server Actions と OpenAPI/Swagger

### Server Actions に Swagger/OpenAPI はあるのか？

**ない** ❌

**理由**: Server Actions は RPC（関数呼び出し）的で、REST API ではないから。

```typescript
// REST API（OpenAPI で定義可能）
GET /api/collections
POST /api/collections

// Server Actions（関数呼び出し）
export async function createCollection(formData: FormData) {
  // ...
}
```

### じゃあドキュメントはどうするの？

**選択肢1: TypeScript の型定義 + JSDoc で代用**（このプロジェクト）

```typescript
/**
 * Collectionを作成する
 * @param formData - フォームデータ（name, description）
 * @returns 作成されたCollection または エラー
 */
export async function createCollection(
  formData: FormData
): Promise<{ error?: string; data?: Collection }> {
  // ...
}
```

**選択肢2: REST API Routes + next-swagger-doc**（外部公開する場合）

**選択肢3: oRPC**（型安全 + OpenAPI 両方欲しい場合）

---

## tRPC と oRPC とは

### tRPC（TypeScript RPC）

**2020年登場、Next.js コミュニティで人気**

TypeScript で型安全な RPC（Remote Procedure Call）を実現するライブラリ。

```typescript
// サーバー側
export const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.query.users.findFirst({
        where: eq(users.id, input.id)
      });
    }),
});

// クライアント側
const { data: user } = trpc.getUser.useQuery({ id: 1 }); // 型安全 ✅
```

**特徴**:
- ✅ 完全な型安全（サーバー → クライアント）
- ✅ Zod でバリデーション
- ✅ React Hooks 統合
- ❌ **OpenAPI サポートなし**

### oRPC（OpenAPI RPC）

**2025年登場、tRPC の問題を解決**

tRPC + OpenAPI の融合。

```typescript
// サーバー側
export const userRouter = os.router({
  getUser: os
    .input(oz.object({ id: oz.number() }))
    .handler(async ({ input }) => {
      return db.query.users.findFirst({
        where: eq(users.id, input.id)
      });
    }),
});

// OpenAPI 自動生成 ← これが tRPC と違う！
import { OpenAPIGenerator } from '@orpc/openapi';
const generator = new OpenAPIGenerator({ ... });
export const openapi = generator.generate(userRouter);
```

**特徴**:
- ✅ 完全な型安全（tRPC と同じ）
- ✅ **OpenAPI 自動生成**（これが最大の違い）
- ✅ Swagger UI 使える
- ✅ Postman で叩ける
- ✅ Server Actions 互換

### いつ使うべきか

| 方式 | 型安全 | OpenAPI | 複雑さ | 用途 |
|------|--------|---------|--------|------|
| **Server Actions** | ✅ | ❌ | 低 | Web のみ（このプロジェクト） |
| **tRPC** | ✅ | ❌ | 中 | 型安全重視、OpenAPI 不要 |
| **oRPC** | ✅ | ✅ | 中 | 型安全 + OpenAPI 両方 |

---

## React Native を追加する場合の API 設計

### 選択肢1: 同じリポジトリ（Next.js に API 追加）

```
recording-anniversaries9/
├── app/
│   ├── (main)/          # Next.js Web UI
│   ├── api/             # ← REST API（Next.js API Routes）
│   │   ├── collections/route.ts
│   │   └── anniversaries/route.ts
│   └── actions/         # Server Actions（Web専用）
```

**メリット**: シンプル、Drizzle schema 共有済み、デプロイ変更なし
**デメリット**: API のタイムアウト制限、型共有が手動

### 選択肢2: 別リポジトリ（専用 API サーバー）

```
recording-anniversaries9/     # Next.js Web
recording-anniversaries9-api/ # Express/Fastify API
recording-anniversaries9-app/ # React Native
```

**メリット**: API が独立、長時間処理OK、スケーラビリティ
**デメリット**: 複雑、Drizzle schema の共有が面倒、デプロイ3回

### 選択肢3: モノレポ（推奨・2025ベストプラクティス）✅

```
monorepo/
├── apps/
│   ├── web/             # Next.js
│   ├── mobile/          # React Native
│   └── api/             # Express/Fastify（必要なら）
├── packages/
│   ├── database/        # Drizzle schema
│   ├── api-client/      # API クライアント（型安全）
│   ├── types/           # 共通型定義
│   └── ui/              # 共通UIコンポーネント
├── pnpm-workspace.yaml
└── turbo.json
```

**メリット**: 1つのリポジトリで全部管理、型安全（End-to-End）、UI コンポーネント共有
**デメリット**: 初期セットアップが複雑（Turborepo 学習コスト）

### 推奨の進め方

1. **今**: Next.js に API 追加、React Native は別リポジトリ
2. **試作**: 型定義は手動コピーで我慢
3. **本格化**: モノレポに移行（Turborepo + pnpm）

**無理にモノレポから始める必要はない** ✅

---

## React Native での認証

### callback URL の問題

React Native には**通常の callback URL がない**ので、別の方法が必要。

### パターン1: Deep Links + OAuth（推奨）✅

**callback URL の代わりに Deep Links を使う**

#### 設定

**Google Cloud Console**:
```
Redirect URI: myapp://oauth/callback
```

**React Native (app.json)**:
```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

#### フロー

```
1. React Native アプリ起動
   ↓
2. "Google でログイン" ボタンタップ
   ↓
3. ブラウザが開く（Google OAuth）
   https://accounts.google.com/o/oauth2/auth?
     redirect_uri=myapp://oauth/callback  ← Deep Link
   ↓
4. ユーザーが承認
   ↓
5. Google がリダイレクト
   myapp://oauth/callback?code=xxx  ← アプリが起動
   ↓
6. React Native がコードをキャッチ
   ↓
7. Next.js API にコードを送信
   POST /api/auth/mobile/callback
   { code: "xxx" }
   ↓
8. Next.js が Google にトークン交換
   ↓
9. JWT トークンを発行
   { token: "eyJhbGciOiJIUzI1NiIs..." }
   ↓
10. React Native がトークンを保存
    await SecureStore.setItemAsync('token', token);
```

#### 実装例

**React Native 側**:
```typescript
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const result = await WebBrowser.openAuthSessionAsync(
      'https://accounts.google.com/o/oauth2/auth?...',
      'myapp://oauth/callback'
    );

    if (result.type === 'success') {
      const code = new URL(result.url).searchParams.get('code');

      const res = await fetch('https://ra.takemitsu.net/api/auth/mobile/callback', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });

      const { token } = await res.json();
      await SecureStore.setItemAsync('auth_token', token);
    }
  };

  return <Button title="Google でログイン" onPress={handleGoogleLogin} />;
}
```

**Next.js API 側**:
```typescript
// app/api/auth/mobile/callback/route.ts
export async function POST(req: NextRequest) {
  const { code } = await req.json();

  // 1. Google にトークン交換
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'myapp://oauth/callback',
      grant_type: 'authorization_code',
    }),
  });

  const { access_token } = await tokenRes.json();

  // 2. ユーザー情報取得
  // 3. DB に保存 or 取得
  // 4. JWT トークン発行
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return NextResponse.json({ token });
}
```

**React Native から API を叩く**:
```typescript
export async function getCollections() {
  const token = await SecureStore.getItemAsync('auth_token');

  const res = await fetch('https://ra.takemitsu.net/api/collections', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}
```

**Next.js API で検証**:
```typescript
// app/api/collections/route.ts
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

  const collections = await db.select()
    .from(collections)
    .where(eq(collections.userId, decoded.userId));

  return NextResponse.json(collections);
}
```

### パターン2: Expo Auth Session（最も簡単）✅

**Expo を使っている場合**

```typescript
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
});

<Button title="Login" onPress={() => promptAsync()} />
```

### callback URL のまとめ

- Web: `https://ra.takemitsu.net/api/auth/callback/google`
- Mobile: `myapp://oauth/callback`（Deep Links）

両方とも Google Cloud Console に登録する ✅

---

## Expo とは

### 定義

**単なるライブラリではなく、React Native の「フレームワーク」** ✅

**例えると**:
```
React : Next.js
  =
React Native : Expo
```

### React Native vs Expo

**React Native CLI**（素の状態）:
```bash
npx react-native init MyApp
```
- Xcode、Android Studio の設定が必要
- ネイティブコード（Swift、Kotlin）を直接編集できる
- 初期設定が複雑
- 自由度が高い

**Expo**（フレームワーク）:
```bash
npx create-expo-app MyApp
```
- Xcode、Android Studio の設定不要（初期段階）
- QRコードでスマホから即テスト可能
- 豊富な標準ライブラリ（カメラ、位置情報、通知など）
- 初期設定が超簡単
- EAS（Expo Application Services）でビルド・デプロイ

### 2025年の状況

**React Native 公式が Expo を推奨している** ✅

> "The React Native core team itself no longer recommends starting new projects with react-native init. Instead, they advocate for using a framework."

### どっちを使うべき？

**Expo を使うべき（95%のケース）** ✅
- 個人プロジェクト
- スタートアップ MVP
- 素早くプロトタイプ作りたい
- カメラ、位置情報など標準機能を使う
- ネイティブコードを書きたくない

**React Native CLI を使うべき（5%のケース）**:
- 特殊なネイティブモジュールが必要
- アプリサイズを極限まで小さくしたい
- 既存のネイティブコードベースがある

### Expo の実態

**Expo は以下を含む**:
1. **Expo CLI** - コマンドラインツール
2. **Expo SDK** - ライブラリ集（カメラ、通知など）
3. **Expo Go** - テスト用スマホアプリ
4. **EAS（Expo Application Services）** - ビルド・デプロイサービス

**つまり**: Library ではなく、**Framework + Platform** ✅

---

## まとめ

このプロジェクトで React Native を追加するなら：

1. **フェーズ1（今すぐ）**: Next.js に REST API 追加、React Native は別リポジトリ（Expo）
2. **認証**: Deep Links + JWT トークン
3. **将来**: 本格化したらモノレポ化を検討

**技術選定**:
- ✅ Expo（React Native フレームワーク）
- ✅ Next.js API Routes（REST API）
- ✅ JWT 認証
- ✅ Deep Links（OAuth callback）

**段階的に進化させればOK** ✅
