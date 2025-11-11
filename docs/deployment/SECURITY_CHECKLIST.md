# セキュリティチェックリスト

本番環境デプロイ前に以下を確認してください。

## 1. HTTPS設定

- [ ] Let's Encrypt でSSL証明書を取得済み
- [ ] `AUTH_URL` が `https://` で始まっている
- [ ] `NEXT_PUBLIC_WEBAUTHN_ORIGIN` が `https://` で始まっている
- [ ] Nginxで HTTP → HTTPS リダイレクトが設定されている
- [ ] `useSecureCookies` が本番環境で `true` になることを確認（`NODE_ENV=production` により自動設定）

## 2. 環境変数

- [ ] `AUTH_SECRET` が強力なランダム文字列（32バイト以上）
- [ ] データベースパスワードが強力
- [ ] `.env.local` のパーミッションが `600`
- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] GitHub Secrets が適切に設定されている（CI/CD使用時）

## 3. データベース

- [ ] 本番DBユーザーに最小限の権限のみ付与
- [ ] MySQLが外部からアクセスできないように設定（`bind-address = 127.0.0.1`）
- [ ] 定期的なバックアップ設定

## 4. ファイアウォール

- [ ] UFW（Uncomplicated Firewall）を有効化
  ```bash
  sudo ufw enable
  sudo ufw allow ssh
  sudo ufw allow 'Nginx Full'
  sudo ufw status
  ```

## 5. Auth.js 設定

- [ ] `auth.ts` の `debug: false` を確認
- [ ] `trustHost: true` が設定されている（リバースプロキシ対応）
- [ ] Google OAuth の本番用認証情報を使用

## 6. サーバーセキュリティ

- [ ] サーバーのセキュリティアップデート
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] SSH鍵認証を使用し、パスワード認証を無効化
- [ ] fail2ban などの侵入検知システム導入（推奨）

## 7. アプリケーションセキュリティ

- [ ] 本番環境で `NODE_ENV=production` が設定されている
- [ ] 不要なログ出力を無効化
- [ ] CORS設定が適切（必要に応じて）

---

**関連ドキュメント**:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイ手順
- [OPERATIONS.md](../operations/OPERATIONS.md) - 運用手順
