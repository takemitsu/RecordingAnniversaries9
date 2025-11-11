# システムアーキテクチャ

Recording Anniversaries 9のシステムアーキテクチャを図解します。

## 目次

1. [システム構成図](#システム構成図)
2. [データフロー図](#データフロー図)
3. [アプリケーション構造](#アプリケーション構造)
4. [データベーススキーマ](#データベーススキーマ)
5. [認証フロー](#認証フロー)

---

## システム構成図

本番環境のインフラ構成を示します。

```mermaid
graph TB
    subgraph Internet
        User[👤 ユーザー<br/>ブラウザ]
    end

    subgraph "さくらVPS (Ubuntu 24.04.3)"
        subgraph "Nginx (1.28.0)"
            Nginx[Nginx<br/>リバースプロキシ<br/>:443/80]
        end

        subgraph "Node.js (20.19.5)"
            subgraph "PM2 (6.0.13)"
                NextJS[Next.js 16<br/>App Router<br/>:3000]
            end
        end

        subgraph "MySQL (8.0.43)"
            DB[(ra9<br/>Database)]
        end

        subgraph "SSL/TLS"
            LetsEncrypt[Let's Encrypt<br/>証明書]
        end
    end

    subgraph "External Services"
        GoogleOAuth[🔐 Google OAuth]
        WebAuthn[🔑 WebAuthn<br/>Passkey]
    end

    User -->|HTTPS| Nginx
    Nginx -->|HTTP| NextJS
    NextJS -->|Drizzle ORM| DB
    NextJS -.->|OAuth 2.0| GoogleOAuth
    NextJS -.->|WebAuthn| WebAuthn
    Nginx -.->|SSL| LetsEncrypt

    style User fill:#e1f5ff
    style NextJS fill:#00d8ff
    style DB fill:#4479a1,color:#fff
    style GoogleOAuth fill:#4285f4,color:#fff
    style WebAuthn fill:#34a853,color:#fff
    style LetsEncrypt fill:#003a70,color:#fff
```

### インフラ仕様

| コンポーネント | バージョン | 用途 |
|--------------|----------|------|
| **Ubuntu** | 24.04.3 LTS | OS |
| **Node.js** | 20.19.5 | ランタイム |
| **npm** | 10.8.2 | パッケージ管理 |
| **MySQL** | 8.0.43 | データベース |
| **Nginx** | 1.28.0 | リバースプロキシ、SSL終端 |
| **PM2** | 6.0.13 | プロセス管理、自動再起動 |
| **Let's Encrypt** | - | SSL証明書 |

---

## データフロー図

ユーザーのリクエストがどのように処理されるかを示します。

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant N as Nginx
    participant A as Next.js<br/>(App Router)
    participant SA as Server Actions
    participant DB as MySQL
    participant Auth as Auth.js
    participant Google as Google OAuth

    Note over U,Google: 認証フロー（初回）
    U->>N: GET /
    N->>A: プロキシ
    A->>U: リダイレクト /auth/signin
    U->>A: Google OAuth選択
    A->>Google: OAuth認証リクエスト
    Google->>U: 認証画面表示
    U->>Google: 認証承認
    Google->>A: 認証トークン
    A->>DB: セッション保存
    A->>U: リダイレクト /

    Note over U,DB: データ取得フロー
    U->>N: GET /
    N->>A: プロキシ
    A->>Auth: セッション検証
    Auth->>DB: セッション取得
    DB-->>Auth: セッション情報
    Auth-->>A: ユーザーID
    A->>DB: Collections取得
    DB-->>A: Collections + Anniversaries
    A->>U: HTMLレンダリング

    Note over U,DB: データ更新フロー（Server Actions）
    U->>N: POST /edit
    N->>A: プロキシ
    A->>SA: Server Action実行
    SA->>Auth: 認証確認
    Auth-->>SA: ユーザーID
    SA->>DB: データ更新
    DB-->>SA: 成功
    SA->>A: revalidatePath
    A->>U: リダイレクト + 更新済みUI
```

### データフローの特徴

- **Server Components**: データ取得はサーバーサイドで実行（DBへ直接アクセス）
- **Server Actions**: フォーム送信は型安全なServer Actionsで処理
- **React cache()**: データ取得結果をキャッシュ、重複クエリを削減
- **revalidatePath**: データ更新後、Next.jsキャッシュを無効化

---

## アプリケーション構造

Next.js 16 App Routerの構造を示します。

```mermaid
graph TD
    subgraph "app/"
        Root[layout.tsx<br/>ルートレイアウト]
        AuthRoutes[auth/<br/>signin/]
        ApiRoutes[api/<br/>auth/...nextauth/]

        subgraph "main/"
            MainLayout["(main)/<br/>layout.tsx<br/>メインレイアウト"]
            HomePage[page.tsx<br/>一覧ページ]

            subgraph "edit/"
                EditPage[page.tsx<br/>編集ページ]

                subgraph "collection/"
                    NewCollection[new/page.tsx<br/>Collection作成]
                    EditCollection["collectionId/<br/>page.tsx<br/>Collection編集"]

                    subgraph "anniversary/"
                        NewAnniv[new/page.tsx<br/>Anniversary作成]
                        EditAnniv["anniversaryId/<br/>page.tsx<br/>Anniversary編集"]
                    end
                end
            end

            subgraph "profile/"
                ProfilePage[page.tsx<br/>プロフィール]
            end
        end

        subgraph "actions/"
            CollActions[collections.ts<br/>CRUD]
            AnnivActions[anniversaries.ts<br/>CRUD]
            ProfileActions[profile.ts<br/>更新]
            AuthActions[authenticators.ts<br/>Passkey管理]
        end
    end

    Root --> MainLayout
    Root --> AuthRoutes
    Root --> ApiRoutes
    MainLayout --> HomePage
    MainLayout --> EditPage
    MainLayout --> ProfilePage
    EditPage --> NewCollection
    EditPage --> EditCollection
    EditCollection --> NewAnniv
    EditCollection --> EditAnniv

    HomePage -.->|使用| CollActions
    EditPage -.->|使用| CollActions
    EditPage -.->|使用| AnnivActions
    ProfilePage -.->|使用| ProfileActions
    ProfilePage -.->|使用| AuthActions

    style Root fill:#00d8ff
    style MainLayout fill:#61dafb
    style HomePage fill:#e1f5ff
    style EditPage fill:#e1f5ff
    style actions/ fill:#ffd700
```

### ディレクトリ構造の特徴

- **ルートグルーピング**: `(main)/`で認証必須ルートをグルーピング
- **ダイナミックルート**: `[collectionId]`、`[anniversaryId]`でパラメータ受け取り
- **コロケーション**: ルーティングとコンポーネントが同じディレクトリ
- **Server Actions**: `app/actions/`で集中管理

---

## データベーススキーマ

3層モデル（Users → Collections → Anniversaries）を採用。

```mermaid
erDiagram
    USERS ||--o{ COLLECTIONS : "has many"
    COLLECTIONS ||--o{ ANNIVERSARIES : "has many"
    USERS ||--o{ ACCOUNTS : "has many"
    USERS ||--o{ SESSIONS : "has many"
    USERS ||--o{ AUTHENTICATORS : "has many"

    USERS {
        string id PK "UUID"
        string name
        string email UK
        datetime emailVerified
        string image
        string googleId UK
        datetime createdAt
        datetime updatedAt
    }

    COLLECTIONS {
        int id PK "AUTO_INCREMENT"
        string userId FK
        string name
        text description
        boolean isVisible
        datetime createdAt
        datetime updatedAt
    }

    ANNIVERSARIES {
        int id PK "AUTO_INCREMENT"
        int collectionId FK
        string name
        date anniversaryDate "DATE型"
        text description
        datetime createdAt
        datetime updatedAt
    }

    ACCOUNTS {
        int id PK
        string userId FK
        string type
        string provider "google"
        string providerAccountId
        text refreshToken
        text accessToken
        int expiresAt
        string tokenType
        string scope
        text idToken
        string sessionState
    }

    SESSIONS {
        string sessionToken PK
        string userId FK
        datetime expires
    }

    AUTHENTICATORS {
        string credentialID PK
        string userId FK
        string providerAccountId
        bytes credentialPublicKey
        int counter
        string credentialDeviceType
        boolean credentialBackedUp
        string transports
    }
```

### スキーマの特徴

- **DATE型**: `anniversaries.anniversary_date`は時刻情報不要のためDATE型
- **CASCADE削除**: Collection削除時、紐づくAnniversariesも自動削除
- **UUID**: Users.idはUUIDで一意性保証
- **Auth.js統合**: accounts, sessions, authenticatorsテーブルでAuth.js v5をサポート

---

## 認証フロー

Google OAuthとPasskey認証の流れを示します。

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant A as Next.js<br/>App
    participant Auth as Auth.js
    participant DB as MySQL
    participant G as Google

    Note over U,G: Google OAuth フロー
    U->>A: /auth/signin
    A->>U: サインイン画面表示
    U->>A: "Sign in with Google"
    A->>G: OAuth認証リクエスト
    G->>U: Google認証画面
    U->>G: 認証承認
    G->>A: Authorization Code
    A->>G: トークン交換
    G->>A: Access Token + ID Token
    A->>Auth: ユーザー情報処理
    Auth->>DB: users/accounts/sessions作成
    A->>U: リダイレクト /

    Note over U,DB: Passkey 登録フロー
    U->>A: /profile
    A->>U: Passkey管理画面
    U->>A: "Register Passkey"
    A->>U: WebAuthn Challenge
    U->>U: 生体認証（指紋/顔認証）
    U->>A: Passkey Credential
    A->>Auth: Passkey検証
    Auth->>DB: authenticators保存
    A->>U: 登録成功

    Note over U,DB: Passkey 認証フロー
    U->>A: /auth/signin
    A->>U: サインイン画面表示
    U->>A: "Sign in with Passkey"
    A->>U: WebAuthn Challenge
    U->>U: 生体認証
    U->>A: Passkey Assertion
    A->>Auth: Passkey検証
    Auth->>DB: authenticators照合
    Auth->>DB: session作成
    A->>U: リダイレクト /
```

### 認証の特徴

- **Database Strategy**: セッションをMySQLで管理（スケーラブル）
- **Secure Cookies**: 本番環境では`__Secure-`プレフィックス付き、HTTPS必須
- **Passkey**: WebAuthn標準準拠、クロスデバイス対応（Conditional UI）
- **セッション有効期限**: デフォルト30日（設定可能）

---

## 技術スタック

### フロントエンド
- **React 19**: useActionStateでフォーム状態管理
- **Next.js 16**: App Router、Server Components、Server Actions
- **Tailwind CSS v4**: ユーティリティファースト、ダークモード対応
- **TypeScript 5**: Strict mode

### バックエンド
- **Node.js 20.19.5**: ランタイム
- **Drizzle ORM**: 型安全なORМ、MySQL統合
- **Auth.js v5**: Google OAuth、Passkey認証
- **Zod**: スキーマバリデーション

### インフラ
- **さくらVPS**: 仮想プライベートサーバー
- **Ubuntu 24.04.3 LTS**: OS
- **MySQL 8.0.43**: リレーショナルデータベース
- **Nginx 1.28.0**: リバースプロキシ、SSL終端
- **PM2 6.0.13**: プロセス管理
- **Let's Encrypt**: SSL/TLS証明書

---

## 参考資料

- [TECH_DECISIONS.md](../reference/TECH_DECISIONS.md) - 技術選定の詳細
- [ADR](../adr/) - アーキテクチャ決定記録
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト概要

---

**最終更新**: 2025-11-11
