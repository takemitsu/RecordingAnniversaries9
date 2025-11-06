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

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
