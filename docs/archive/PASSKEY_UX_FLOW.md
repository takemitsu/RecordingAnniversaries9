# Passkey UI/UXフロー設計

## 関連ドキュメント

このドキュメントはUI/UXフローの設計を記載しています。
技術実装の詳細は **[PASSKEY_PLAN.md](./PASSKEY_PLAN.md)** を参照してください。

---

## 現在のアプリのユーザーフロー

### 認証フロー
```
未認証ユーザー → /auth/signin (Google認証のみ) → / (ホーム)
                                                    ↓
                                          記念日一覧表示
                                                    ↓
                                    /edit (編集) / /profile (プロフィール)
```

### 既存の導線
- **サインインページ** (`/auth/signin`): Googleログインボタンのみ
- **ホームページ** (`/`): 記念日一覧、未認証時はサインインへリダイレクト
- **プロフィールページ** (`/profile`): ユーザー名変更
- **ハンバーガーメニュー**: 一覧/編集/プロフィール間のナビゲーション

## Passkey統合後のユーザージャーニー

### シナリオA: 新規ユーザー（初回訪問）

```
1. /auth/signin に訪問
   ↓
2. 選択肢を表示:
   [🔑 Passkeyでログイン] ← WebAuthn対応時のみ表示
   [  Googleでログイン  ]
   ↓
3a. Passkeyボタンクリック
   → Passkey未登録なので失敗（InvalidStateError）
   → エラー表示: "Passkeyが登録されていません"
   → [Googleでログイン] ボタン表示（このケースのみ誘導）

3b. Googleボタンクリック
   → Google認証
   → / (ホーム) へリダイレクト
   ↓
4. 初回ログイン検出
   → トースト通知: "Passkeyを設定すると次回から簡単にログインできます"
   → [設定する] [後で] ボタン
   ↓
5a. [設定する] クリック
   → /profile へ遷移
   → Passkey作成フロー実行

5b. [後で] クリック
   → 通常のホーム画面
```

### シナリオB: 既存ユーザー（Google認証のみ）

```
1. /auth/signin に訪問
   ↓
2. [  Googleでログイン  ] クリック
   → Google認証
   → / (ホーム) へ
   ↓
3. /profile に任意のタイミングで訪問
   ↓
4. Passkey設定セクション表示:
   [🔑 新しいPasskeyを作成]
   ↓
5. ボタンクリック
   → WebAuthn登録フロー
   → 生体認証プロンプト（OS/ブラウザ提供）
   → 成功 → "Passkeyが作成されました" 通知
   → 失敗 → エラー表示
```

### シナリオC: Passkey登録済みユーザー

```
1. /auth/signin に訪問
   ↓
2. 選択肢を表示:
   [🔑 Passkeyでログイン]
   [  Googleでログイン  ]
   ↓
3. Passkeyボタンクリック
   → WebAuthn認証フロー
   → 生体認証プロンプト
   → 成功 → / (ホーム) へ
   → 失敗 → エラー種類に応じた処理（下記参照）
```

### シナリオD: 複数デバイス利用

```
1. デバイスA（Mac）で登録済み
   ↓
2. デバイスB（iPhone）から /auth/signin
   ↓
3. [🔑 Passkeyでログイン] クリック
   ↓
4. iOSが検出:
   - "このデバイスのPasskey"
   - "別のデバイスを使用" （QRコード）
   ↓
5a. "このデバイスのPasskey" → 未登録なのでエラー
5b. "別のデバイスを使用" → QRコード表示 → Macで読み取り → 認証成功
   ↓
6. ログイン後、/profile から「このデバイスにもPasskeyを作成」を促す
```

## 各画面の状態パターンと必要なUI

### 1. サインインページ (`/auth/signin`)

#### 状態パターン

| 状態 | 条件 | 表示するUI |
|------|------|-----------|
| **A: WebAuthn対応** | `PublicKeyCredential`サポート | Passkeyボタン + Googleボタン |
| **B: WebAuthn非対応** | 古いブラウザ | Googleボタンのみ + 注意書き |
| **C: エラー状態** | Passkey認証失敗 | エラーメッセージ + フォールバック |

#### 必要なUIコンポーネント

```typescript
// 1. Passkey対応チェック
const isWebAuthnSupported = typeof window !== "undefined" &&
  window.PublicKeyCredential !== undefined;

// 2. 条件付きボタン表示
{isWebAuthnSupported && (
  <button onClick={() => signIn("passkey")}>
    🔑 Passkeyでログイン
  </button>
)}

// 3. エラー表示
{error && (
  <div className="error">
    {error === "PasskeyNotRegistered" && (
      <p>Passkeyが登録されていません。Googleでログインしてください</p>
    )}
    {error === "PasskeyAuthFailed" && (
      <p>認証に失敗しました。もう一度お試しいただくか、Googleでログインしてください</p>
    )}
  </div>
)}

// 4. 説明テキスト
<div className="info">
  <p>Passkeyとは？</p>
  <details>
    <summary>詳しく見る</summary>
    <p>生体認証（Touch ID、Face IDなど）でログインできるセキュアな方式です</p>
  </details>
</div>
```

### 2. プロフィールページ (`/profile`)

#### 状態パターン

| 状態 | 条件 | 表示するUI |
|------|------|-----------|
| **A: Passkey未登録** | `authenticators.length === 0` | 作成ボタン + 説明 |
| **B: Passkey登録済み（単一）** | `authenticators.length === 1` | 一覧 + 追加ボタン |
| **C: Passkey登録済み（複数）** | `authenticators.length > 1` | 一覧 + 追加ボタン |
| **D: WebAuthn非対応** | ブラウザ非対応 | 注意書きのみ |

#### 必要なUIコンポーネント

```typescript
// Passkey設定セクション
<section>
  <h2>Passkey設定</h2>

  {/* 未登録時の説明 */}
  {authenticators.length === 0 && (
    <div className="onboarding">
      <p>🔐 Passkeyを設定すると、パスワード不要で簡単・安全にログインできます</p>
      <ul>
        <li>✅ 生体認証（Touch ID、Face IDなど）で即座にログイン</li>
        <li>✅ パスワード漏洩の心配なし</li>
        <li>✅ フィッシング詐欺に強い</li>
      </ul>
    </div>
  )}

  {/* Passkey作成ボタン */}
  <form action={createPasskeyAction}>
    <button type="submit">
      🔑 {authenticators.length === 0 ? "Passkeyを作成" : "このデバイスにPasskeyを追加"}
    </button>
  </form>

  {/* 登録済みPasskey一覧 */}
  {authenticators.length > 0 && (
    <div className="passkey-list">
      <h3>登録済みPasskey ({authenticators.length})</h3>
      <ul>
        {authenticators.map((auth) => (
          <li key={auth.credentialID}>
            <div>
              <span className="device-type">
                {auth.credentialDeviceType === "singleDevice" ? "📱" : "💻"}
                {auth.credentialDeviceType}
              </span>
              <span className="backup-status">
                {auth.credentialBackedUp ? "☁️ クラウド同期" : "🔒 このデバイスのみ"}
              </span>
            </div>
            <form action={deletePasskeyAction.bind(null, auth.credentialID)}>
              <button type="submit">削除</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )}

  {/* ヘルプ・注意事項 */}
  <details className="help">
    <summary>よくある質問</summary>
    <dl>
      <dt>Q: Passkeyを削除すると？</dt>
      <dd>A: このデバイスではPasskeyでログインできなくなりますが、Googleログインは引き続き使えます</dd>

      <dt>Q: 機種変更したら？</dt>
      <dd>A: 新しいデバイスでGoogleログイン後、再度Passkeyを作成してください</dd>

      <dt>Q: 複数デバイスで使える？</dt>
      <dd>A: 各デバイスでPasskeyを作成できます。iCloudやGoogleアカウントで同期される場合もあります</dd>
    </dl>
  </details>
</section>
```

### 3. 初回ログイン時のオンボーディング

#### トースト通知（Home画面に表示）

```typescript
// app/(main)/page.tsx に追加

// 初回ログイン判定（例：authenticatorsテーブルが空 && 初回セッション）
const isFirstLogin = authenticators.length === 0 &&
  /* 何らかの初回判定ロジック */;

{isFirstLogin && (
  <div className="toast-notification">
    <div className="content">
      <span>🔑</span>
      <p>Passkeyを設定すると次回から簡単にログインできます</p>
    </div>
    <div className="actions">
      <Link href="/profile">
        <button className="primary">設定する</button>
      </Link>
      <button className="secondary" onClick={dismissToast}>
        後で
      </button>
    </div>
  </div>
)}
```

### 4. エラーハンドリングUI

#### エラーパターンと処理（提案B: エラー種類で分岐）

| エラーコード | 原因 | 表示メッセージ | アクション |
|-------------|------|---------------|-----------|
| `NotAllowedError` | ユーザーがキャンセル | （表示しない） | サインインページに戻る |
| `InvalidStateError` | Passkey未登録 | "Passkeyが登録されていません" | [Googleでログイン] ボタン |
| `NotSupportedError` | ブラウザ非対応 | "このブラウザはPasskeyに対応していません" | サインインページに戻る |
| `NetworkError` | 通信エラー | "ネットワークエラーが発生しました" | [もう一度試す] ボタン |
| `UnknownError` | その他 | "認証に失敗しました" | サインインページに戻る + エラー表示 |

**設計思想**:
- **NotAllowedError（キャンセル）**: ユーザーの意図的な操作なので、静かにサインインページに戻す
- **InvalidStateError（未登録）**: 初回ユーザーの可能性が高いので、Googleログインを推奨
- **その他**: サインインページで選択肢を再表示し、ユーザーが判断

#### エラー表示コンポーネント

```typescript
// エラーハンドリングロジック
function handlePasskeyError(error: Error) {
  switch (error.name) {
    case "NotAllowedError":
      // ユーザーがキャンセル → 静かにサインインページへ
      router.push("/auth/signin");
      break;

    case "InvalidStateError":
      // Passkey未登録 → Google誘導
      setError({
        message: "Passkeyが登録されていません",
        action: "google",
      });
      break;

    case "NetworkError":
      // 通信エラー → リトライ推奨
      setError({
        message: "ネットワークエラーが発生しました",
        action: "retry",
      });
      break;

    default:
      // その他 → サインインページへ戻る + エラー表示
      setError({
        message: "認証に失敗しました",
        action: "back",
      });
      break;
  }
}

// エラー表示UI
{error && (
  <div className="error-banner">
    <span className="icon">⚠️</span>
    <div className="message">
      <p>{error.message}</p>
    </div>
    <div className="actions">
      {error.action === "retry" && (
        <button onClick={retryPasskey}>もう一度試す</button>
      )}
      {error.action === "google" && (
        <button onClick={() => signIn("google")}>Googleでログイン</button>
      )}
      {error.action === "back" && (
        <button onClick={() => router.push("/auth/signin")}>戻る</button>
      )}
    </div>
  </div>
)}
```

## UIフロー図

### 全体フロー

```
                        [START]
                           |
                    未認証ユーザー
                           |
                    /auth/signin
                           |
          +----------------+----------------+
          |                                 |
    [Passkeyでログイン]              [Googleでログイン]
          |                                 |
    WebAuthn認証                        Google認証
          |                                 |
    +-----+-----+                           |
    |           |                           |
  成功       失敗                            |
    |           |                           |
    |      エラー表示                         |
    |      Googleへ誘導 -------------------+
    |                                       |
    +---------------------------------------+
                           |
                       / (ホーム)
                           |
                +----------+----------+
                |                     |
          初回ログイン?            通常表示
                |                     |
          トースト通知                 |
          [設定する][後で]              |
                |                     |
          /profile                    |
                |                     |
    [🔑 Passkeyを作成]                |
                |                     |
          WebAuthn登録                 |
                |                     |
          +-----+-----+                |
          |           |                |
        成功       失敗                |
          |           |                |
    "作成完了"   エラー表示             |
          |           |                |
          +-----+-----+----------------+
                |
          通常利用継続
                |
             [END]
```

## 実装の優先順位

### Phase 1: 基本機能（必須）
1. ✅ サインインページにPasskeyボタン追加
2. ✅ WebAuthn対応チェック（Conditional UI）
3. ✅ プロフィールページにPasskey作成機能
4. ✅ 基本的なエラー表示

### Phase 2: UX改善（推奨）
1. 初回ログイン時のトースト通知
2. プロフィールページのオンボーディング説明
3. Passkey一覧の詳細表示（デバイス種別、バックアップ状態）
4. 詳細なエラーメッセージ

### Phase 3: 高度な機能（オプション）
1. よくある質問セクション
2. Passkey使用状況の統計
3. デバイス名のカスタマイズ
4. Cross-device認証のガイド

## 必要な新規コンポーネント

### 1. `PasskeyButton.tsx`
- Passkeyログインボタン
- WebAuthn対応チェック
- ローディング状態
- エラー表示

### 2. `PasskeyOnboarding.tsx`
- 初回ログイン時のトースト
- 説明文とCTA

### 3. `PasskeyList.tsx`
- 登録済みPasskey一覧
- デバイス情報表示
- 削除機能

### 4. `PasskeyErrorBoundary.tsx`
- エラーハンドリング
- フォールバック表示

### 5. `PasskeyHelp.tsx`
- よくある質問
- 使い方ガイド

## State Management

### Client State
```typescript
type PasskeyUIState = {
  isSupported: boolean;          // WebAuthn対応
  isRegistering: boolean;        // 登録中
  isAuthenticating: boolean;     // 認証中
  error: PasskeyError | null;    // エラー
  showOnboarding: boolean;       // オンボーディング表示
};
```

### Server State（Database）
```typescript
// authenticatorsテーブル
type Authenticator = {
  credentialID: string;
  userId: string;
  credentialDeviceType: string;  // UI表示用
  credentialBackedUp: boolean;   // UI表示用
  // ...
};
```

---

**最終更新**: 2025-11-06
**作成者**: Claude Code
