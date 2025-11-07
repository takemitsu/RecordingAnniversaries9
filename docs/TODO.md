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
- [x] ✅ Passkey（WebAuthn）実装完了（Phase 1-4）
  - Phase 1: Auth.js v5 WebAuthn Provider 統合
  - Phase 2: Passkey 作成・削除 UI
  - Phase 3: サインインフロー実装
  - Phase 4: UX改善（エラーハンドリング、ボタン順序、削除確認）
  - Phase 5: 使用履歴の記録と表示（createdAt, lastUsedAt）

#### 残作業
- [x] ✅ **E2Eテストの追加**（完了）
  - e2e/passkey.spec.ts 追加（5テスト）
  - サインインページでPasskey/Googleボタン表示確認
  - プロフィールページでPasskey管理UI表示確認
  - Passkey未登録時のメッセージ表示確認
  - 総E2Eテスト数: 24テスト（全て通過）
  - **注意**: 実際の認証フローのテストは手動テスト推奨（PlaywrightでのWebAuthn自動テストは複雑）
- [x] ✅ **本番デプロイ前の設定確認**（完了）
  - auth.ts の `debug: false` ✅（設定済み）
  - auth.ts の `useSecureCookies` を NODE_ENV で自動切り替え ✅（本番: true、開発: false）
  - WebAuthn の RP ID/Origin 設定（Auth.jsが自動取得、カスタマイズ不要）
- [x] ✅ **ドキュメント更新**（完了）
  - README.md に Passkey 機能の説明追加
  - SETUP.md に WebAuthn セットアップ手順追加（オプション）
  - docs/DEPLOYMENT.md 作成（さくらVPS向け包括的デプロイガイド）

### 機能
- [ ] ブラウザプッシュ通知（検討）

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
