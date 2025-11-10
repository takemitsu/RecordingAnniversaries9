# トラブルシューティング

本番環境で発生する可能性のある問題と対処法をまとめています。

## 目次

1. [アプリケーションが起動しない](#アプリケーションが起動しない)
2. [データベース接続エラー](#データベース接続エラー)
3. [Google OAuth ログインができない](#google-oauth-ログインができない)
4. [Passkey認証が動作しない](#passkey認証が動作しない)
5. [SSL証明書エラー](#ssl証明書エラー)
6. [デプロイ後にサイトが表示されない](#デプロイ後にサイトが表示されない)
7. [CI/CDデプロイが失敗する](#cicdデプロイが失敗する)
8. [PM2関連のトラブル](#pm2関連のトラブル)

---

## アプリケーションが起動しない

### 確認事項

#### 1. PM2ステータス確認

```bash
pm2 list
pm2 logs ra9-app --lines 100
```

#### 2. 環境変数が正しく設定されているか

```bash
cat .env.local
```

#### 3. ポート3000が使用されていないか

```bash
sudo lsof -i :3000
```

#### 4. ビルドが成功しているか

```bash
ls -la .next/
```

---

## データベース接続エラー

### 確認事項

#### 1. MySQLが起動しているか

```bash
sudo systemctl status mysql
```

#### 2. `DATABASE_URL` が正しいか確認

`.env.local` の `DATABASE_URL` を確認

#### 3. データベースユーザーの権限確認

```sql
SHOW GRANTS FOR 'ra9user'@'localhost';
```

#### 4. データベースが存在するか

```bash
mysql -u ra9user -p -e "SHOW DATABASES;"
```

---

## Google OAuth ログインができない

### 確認事項

#### 1. Google Cloud Consoleで本番ドメインのリダイレクトURIが登録されているか

- `https://ra.takemitsu.net/api/auth/callback/google`

#### 2. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` が本番用か確認

#### 3. `AUTH_URL` が `https://ra.takemitsu.net` になっているか

#### 4. ブラウザのコンソールエラーを確認

---

## Passkey認証が動作しない

### 確認事項

#### 1. HTTPS が有効になっているか（WebAuthnはHTTPSが必須）

#### 2. `NEXT_PUBLIC_WEBAUTHN_RP_ID` がドメイン名と一致しているか

```env
NEXT_PUBLIC_WEBAUTHN_RP_ID="ra.takemitsu.net"
```

#### 3. `NEXT_PUBLIC_WEBAUTHN_ORIGIN` が正しいか

```env
NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://ra.takemitsu.net"
```

#### 4. ブラウザがWebAuthnをサポートしているか確認

---

## SSL証明書エラー

### 確認事項

#### 1. Let's Encrypt 証明書の有効期限確認

```bash
sudo certbot certificates
```

#### 2. 証明書の更新

```bash
sudo certbot renew
sudo systemctl restart nginx
```

#### 3. Nginx設定ファイルの構文確認

```bash
sudo nginx -t
```

---

## デプロイ後にサイトが表示されない

### 確認事項

#### 1. PM2でアプリケーションが起動しているか

```bash
pm2 list
pm2 logs ra9-app
```

#### 2. Nginxが起動しているか

```bash
sudo systemctl status nginx
```

#### 3. ファイアウォールでポート80/443が開いているか

```bash
sudo ufw status
```

#### 4. DNS設定が正しいか

```bash
dig ra.takemitsu.net
```

---

## CI/CDデプロイが失敗する

### 確認事項

#### 1. GitHub Secrets が正しく設定されているか

- VPS_HOST, VPS_USER, VPS_SSH_KEY, PRODUCTION_ENV

#### 2. SSH鍵が正しいか（ローカルで接続テスト）

```bash
ssh -i ~/.ssh/id_rsa ubuntu@takemitsu.net
```

#### 3. GitHub Actions のログを確認

- リポジトリ → Actions → 失敗したワークフロー → ログ確認

#### 4. VPS側のディスク容量確認

```bash
df -h
```

---

## PM2関連のトラブル

### 問題: PM2でアプリケーションが自動起動しない

サーバー再起動後、アプリケーションが自動的に起動しない場合。

#### 確認事項

#### 1. PM2 startup が設定されているか確認

```bash
# PM2 startupの状態確認
pm2 startup

# 表示されたコマンドを実行（まだ設定していない場合）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

#### 2. 現在のプロセスリストを保存

```bash
# PM2でアプリを起動してから保存
pm2 start npm --name "ra9-app" -- start
pm2 save
```

#### 3. systemd サービスが有効か確認

```bash
# systemdサービスの状態確認
sudo systemctl status pm2-ubuntu

# 無効な場合は有効化
sudo systemctl enable pm2-ubuntu
```

#### 4. サーバー再起動テスト

```bash
# 再起動後にPM2が自動起動するかテスト
sudo reboot

# 再起動後にSSH接続して確認
pm2 list
```

---

### 問題: メモリ不足でアプリケーションが停止する

アプリケーションが突然停止し、ログに "out of memory" エラーが記録される場合。

#### 確認事項

#### 1. メモリ使用量確認

```bash
# PM2のモニタリング画面
pm2 monit

# システム全体のメモリ使用量
free -h

# プロセスごとのメモリ使用量
top
```

#### 2. PM2ログでメモリエラーを確認

```bash
# エラーログ確認
pm2 logs ra9-app --lines 100 | grep -i "memory"
pm2 logs ra9-app --err --lines 100
```

#### 3. Next.jsのメモリ制限を設定

`.env.local` に以下を追加（必要に応じて調整）:

```env
# Node.jsのメモリ制限（例: 512MB）
NODE_OPTIONS="--max-old-space-size=512"
```

#### 4. PM2でメモリ制限付きで再起動

```bash
# PM2でメモリ制限を設定して再起動
pm2 delete ra9-app
pm2 start npm --name "ra9-app" --max-memory-restart 512M -- start

# 設定を保存
pm2 save
```

---

## 関連ドキュメント

- [OPERATIONS.md](./OPERATIONS.md) - 日常運用手順
- [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - デプロイ手順
- [SECURITY_CHECKLIST.md](../deployment/SECURITY_CHECKLIST.md) - セキュリティチェック
