# TODO

## 未実装・今後の拡張 🚧

### セキュリティ強化
- [ ] **Server Actionsレート制限の実装**（優先度: Low）
  - 認証済みアプリではリスク低（悪意のある正規ユーザーのみ）
  - 本番デプロイ前に再検討
  - 実装候補:
    - `upstash/ratelimit` + Redis/Vercel KV（本番推奨）
    - カスタムメモリベース実装（開発環境向け）
  - 推奨レート: 10-20 req/min（フォーム送信）、60 req/min（読み取り）

### 認証
- [ ] Passkey（WebAuthn）実装
  - Auth.js v5の対応待ちまたはカスタム実装が必要
  - `@simplewebauthn/server`, `@simplewebauthn/browser` インストール済み

### 機能
- [ ] ブラウザプッシュ通知（検討）

### UI/UX
- [ ] アクセシビリティさらなる改善

### コード品質
- [ ] **Zodバリデーションの導入**
  - Server Actions のフォームバリデーション強化
  - 型安全性向上（FormData → Zod schema → TypeScript types）
  - 対象: `app/actions/collections.ts`, `app/actions/anniversaries.ts`
  - 現状: 手動バリデーションのみ

- [ ] **FormData ヘルパー関数の作成**（検討）
  - `lib/utils/formData.ts` の作成
  - 共通パターンの抽出（trim、null変換、数値変換）
  - 型安全なFormDataパーサー実装

- [ ] **環境変数の型安全性向上**
  - `lib/env.ts` の作成（Zod + process.env）
  - 環境変数の自動補完とバリデーション
  - ビルド時の環境変数チェック
  - 例: `@t3-oss/env-nextjs` パターンの採用

### テスト
- [ ] E2Eテスト（Playwright）
- [ ] Unitテスト（Vitest）

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
