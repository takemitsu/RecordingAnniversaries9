# 本番環境デプロイガイド

このドキュメントは、Recording Anniversaries 9 をさくらVPS（または同様のVPS）に本番デプロイする手順をまとめたものです。

## 目次

1. [前提条件](#前提条件)
2. [サーバーセットアップ](#サーバーセットアップ)
3. [アプリケーションデプロイ](#アプリケーションデプロイ)
4. [Nginx設定（リバースプロキシ）](#nginx設定リバースプロキシ)
5. [SSL証明書取得（Let's Encrypt）](#ssl証明書取得lets-encrypt)
6. [データベース初期化](#データベース初期化)
7. [環境変数設定](#環境変数設定)
8. [セキュリティチェックリスト](#セキュリティチェックリスト)
9. [運用・メンテナンス](#運用メンテナンス)
10. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### サーバー要件

- **OS**: Ubuntu 22.04 LTS（または CentOS/Rocky Linux）
- **RAM**: 2GB以上推奨
- **ストレージ**: 10GB以上
- **Node.js**: v18以上
- **MySQL**: 8.0以上
- **ドメイン**: HTTPS用（例: `your-domain.com`）

### ローカル環境

- Git
- SSH クライアント
- 本番用の Google OAuth 認証情報

---

## サーバーセットアップ

### 1. Node.js インストール

**Ubuntu/Debian:**

```bash
# Node.js 20.x（LTS）をインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node -v  # v20.x.x
npm -v   # 10.x.x
```

**CentOS/Rocky Linux:**

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 2. MySQL インストール

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y mysql-server

# MySQL起動・自動起動設定
sudo systemctl start mysql
sudo systemctl enable mysql

# セキュリティ設定
sudo mysql_secure_installation
```

**データベースとユーザー作成:**

```sql
-- MySQLにログイン
sudo mysql -u root -p

-- データベース作成
CREATE DATABASE ra9_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ユーザー作成と権限付与
CREATE USER 'ra9user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON ra9_production.* TO 'ra9user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. PM2 インストール（プロセス管理）

```bash
# グローバルインストール
sudo npm install -g pm2

# 自動起動設定
pm2 startup
# 表示されたコマンドをコピーして実行
```

### 4. Nginx インストール（リバースプロキシ）

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y nginx

# Nginx起動・自動起動設定
sudo systemctl start nginx
sudo systemctl enable nginx

# ファイアウォール設定（HTTP/HTTPS許可）
sudo ufw allow 'Nginx Full'
```

---

## アプリケーションデプロイ

### 1. ユーザー作成（推奨）

```bash
# アプリケーション専用ユーザー作成
sudo adduser ra9app
sudo usermod -aG sudo ra9app  # sudoが必要な場合
su - ra9app
```

### 2. リポジトリクローン

```bash
# ホームディレクトリに移動
cd ~

# Gitクローン
git clone https://github.com/YOUR_USERNAME/recording-anniversaries9.git
cd recording-anniversaries9

# 本番ブランチにチェックアウト（main/masterなど）
git checkout main
```

### 3. 依存関係インストール

```bash
npm ci --omit=dev
```

### 4. 環境変数設定

`.env.local` ファイルを作成（**重要**: このファイルは Git にコミットしないこと）:

```bash
nano .env.local
```

内容については [環境変数設定](#環境変数設定) セクション参照。

### 5. ビルド

```bash
npm run build
```

**重要**: `npm run build` を実行すると、Next.jsは自動的に `NODE_ENV=production` を設定します。これにより：

- `useSecureCookies: true` が有効になる（HTTPS対応）
- 最適化されたプロダクションビルドが生成される

### 6. PM2でアプリケーション起動

```bash
# PM2でNext.jsサーバーを起動
pm2 start npm --name "ra9-app" -- start

# 起動確認
pm2 list

# ログ確認
pm2 logs ra9-app

# 自動起動設定を保存
pm2 save
```

**PM2エコシステムファイル（推奨）:**

`ecosystem.config.js` を作成して、より詳細な設定を行うこともできます：

```javascript
module.exports = {
  apps: [{
    name: 'ra9-app',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

起動:

```bash
pm2 start ecosystem.config.js
```

---

## Nginx設定（リバースプロキシ）

### 1. Nginx設定ファイル作成

```bash
sudo nano /etc/nginx/sites-available/ra9-app
```

**内容（HTTP版、後でHTTPSに変更）:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 設定を有効化

```bash
# シンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/ra9-app /etc/nginx/sites-enabled/

# デフォルト設定を無効化（必要に応じて）
sudo rm /etc/nginx/sites-enabled/default

# 設定ファイルの構文チェック
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx
```

---

## SSL証明書取得（Let's Encrypt）

### 1. Certbot インストール

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### 2. SSL証明書取得

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

プロンプトに従って、メールアドレスを入力し、規約に同意します。

**自動更新設定:**

```bash
# 自動更新のテスト
sudo certbot renew --dry-run

# Cronジョブで自動更新（通常はインストール時に自動設定される）
sudo crontab -e
# 以下を追加（毎日2回実行）
0 */12 * * * certbot renew --quiet
```

### 3. Nginx設定の最終確認

Certbotが自動的にNginx設定を更新します。設定ファイルを確認：

```bash
sudo nano /etc/nginx/sites-available/ra9-app
```

以下のようになっているはずです：

```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = your-domain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 404; # managed by Certbot
}
```

Nginx再起動:

```bash
sudo systemctl restart nginx
```

---

## データベース初期化

### 1. マイグレーション実行

```bash
cd ~/recording-anniversaries9

# マイグレーション実行（本番DB）
npm run db:migrate
```

**重要**: `npm run db:migrate` を使用すること。`npx drizzle-kit migrate` は環境変数の読み込みに問題があるため使用禁止。

### 2. マイグレーション確認

```bash
# MySQLにログイン
mysql -u ra9user -p ra9_production

# テーブル確認
SHOW TABLES;

# スキーマ確認
DESCRIBE users;
DESCRIBE collections;
DESCRIBE anniversaries;
DESCRIBE accounts;
DESCRIBE sessions;
DESCRIBE authenticators;

EXIT;
```

---

## 環境変数設定

`.env.local` に以下を設定（**本番環境用**）:

```env
# Database Configuration（本番DB）
DATABASE_URL="mysql://ra9user:YOUR_STRONG_PASSWORD_HERE@127.0.0.1:3306/ra9_production"

# Test Database（不要。本番環境ではコメントアウト可）
# TEST_DATABASE_URL="mysql://..."

# Auth.js Configuration
# 生成方法: openssl rand -base64 32
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://your-domain.com"

# Google OAuth（本番用認証情報）
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# WebAuthn (Passkey) Configuration
# 本番環境ではドメイン名を指定
NEXT_PUBLIC_WEBAUTHN_RP_ID="your-domain.com"
NEXT_PUBLIC_WEBAUTHN_RP_NAME="Recording Anniversaries"
NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://your-domain.com"

# Application
NEXT_PUBLIC_APP_NAME="Recording Anniversaries 9"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Timezone
TZ="Asia/Tokyo"

# Next.js Telemetry（Vercel未使用のため無効化）
NEXT_TELEMETRY_DISABLED=1
```

### 重要ポイント

#### 1. NODE_ENV について

**Node.js/Next.jsでは自動的に設定されます**（手動設定不要）:

- `npm run dev` → `NODE_ENV=development`（開発モード）
- `npm run build` → `NODE_ENV=production`（ビルド時）
- `npm start` → `NODE_ENV=production`（本番起動）

**影響**:

- `useSecureCookies: process.env.NODE_ENV === "production"` により、本番環境では自動的に `true` になります
- Cookie名: 本番では `__Secure-authjs.session-token`（HTTPS必須）
- 開発環境では `authjs.session-token`（HTTP対応）

#### 2. AUTH_SECRET 生成

```bash
openssl rand -base64 32
```

#### 3. Google OAuth 本番用認証情報

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト作成（または既存プロジェクト選択）
3. 「APIとサービス」→「認証情報」
4. 「OAuth 2.0 クライアントID」を作成
5. 承認済みのリダイレクトURI: `https://your-domain.com/api/auth/callback/google`

**注意**: 開発環境と本番環境で異なるOAuth認証情報を使用すること。

#### 4. 環境変数のセキュリティ

- `.env.local` のパーミッション設定:
  ```bash
  chmod 600 .env.local
  ```
- `.env.local` は絶対にGitにコミットしない（`.gitignore`で除外されています）

---

## セキュリティチェックリスト

本番環境デプロイ前に以下を確認してください。

### 1. HTTPS設定

- [ ] Let's Encrypt でSSL証明書を取得済み
- [ ] `AUTH_URL` が `https://` で始まっている
- [ ] `NEXT_PUBLIC_WEBAUTHN_ORIGIN` が `https://` で始まっている
- [ ] Nginxで HTTP → HTTPS リダイレクトが設定されている
- [ ] `useSecureCookies` が本番環境で `true` になることを確認（`NODE_ENV=production` により自動設定）

### 2. 環境変数

- [ ] `AUTH_SECRET` が強力なランダム文字列（32バイト以上）
- [ ] データベースパスワードが強力
- [ ] `.env.local` のパーミッションが `600`

### 3. データベース

- [ ] 本番DBユーザーに最小限の権限のみ付与
- [ ] MySQLが外部からアクセスできないように設定（`bind-address = 127.0.0.1`）
- [ ] 定期的なバックアップ設定

### 4. ファイアウォール

- [ ] UFW（Uncomplicated Firewall）を有効化
  ```bash
  sudo ufw enable
  sudo ufw allow ssh
  sudo ufw allow 'Nginx Full'
  sudo ufw status
  ```

### 5. Auth.js 設定

- [ ] `auth.ts` の `debug: false` を確認
- [ ] `trustHost: true` が設定されている（リバースプロキシ対応）
- [ ] Google OAuth の本番用認証情報を使用

### 6. レート制限（推奨）

現在、Server Actionsのレート制限は未実装です。将来的に実装を検討する場合：

- [ ] `upstash/ratelimit` + Redis/Vercel KV を使用
- [ ] 推奨レート: 10-20 req/min（フォーム送信）、60 req/min（読み取り）

### 7. その他

- [ ] PM2でアプリケーションが自動再起動するよう設定
- [ ] サーバーのセキュリティアップデート
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] SSH鍵認証を使用し、パスワード認証を無効化
- [ ] fail2ban などの侵入検知システム導入

---

## 運用・メンテナンス

### アプリケーション更新

```bash
cd ~/recording-anniversaries9

# Gitから最新版を取得
git pull origin main

# 依存関係を更新（必要に応じて）
npm ci --omit=dev

# ビルド
npm run build

# PM2でアプリケーションを再起動
pm2 restart ra9-app

# ログ確認
pm2 logs ra9-app
```

### データベースマイグレーション（スキーマ変更時）

```bash
cd ~/recording-anniversaries9

# マイグレーション実行
npm run db:migrate

# アプリケーション再起動
pm2 restart ra9-app
```

### ログ確認

```bash
# PM2ログ
pm2 logs ra9-app

# Nginxログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQLログ
sudo tail -f /var/log/mysql/error.log
```

### バックアップ

**データベースバックアップ:**

```bash
# バックアップディレクトリ作成
mkdir -p ~/backups

# SQLダンプ作成
mysqldump -u ra9user -p ra9_production > ~/backups/ra9_production_$(date +%Y%m%d_%H%M%S).sql

# 定期的な自動バックアップ（cron）
crontab -e
# 毎日午前3時にバックアップ
0 3 * * * mysqldump -u ra9user -pYOUR_PASSWORD ra9_production > ~/backups/ra9_production_$(date +\%Y\%m\%d).sql
```

**ファイルバックアップ:**

```bash
# アプリケーションディレクトリのバックアップ（.env.localを含む）
tar -czf ~/backups/ra9_app_$(date +%Y%m%d).tar.gz ~/recording-anniversaries9
```

---

## トラブルシューティング

### 問題: アプリケーションが起動しない

**確認事項:**

1. PM2ステータス確認
   ```bash
   pm2 list
   pm2 logs ra9-app --lines 100
   ```

2. 環境変数が正しく設定されているか
   ```bash
   cat .env.local
   ```

3. ポート3000が使用されていないか
   ```bash
   sudo lsof -i :3000
   ```

### 問題: データベース接続エラー

**確認事項:**

1. MySQLが起動しているか
   ```bash
   sudo systemctl status mysql
   ```

2. `DATABASE_URL` が正しいか確認

3. データベースユーザーの権限確認
   ```sql
   SHOW GRANTS FOR 'ra9user'@'localhost';
   ```

### 問題: Google OAuth ログインができない

**確認事項:**

1. Google Cloud Consoleで本番ドメインのリダイレクトURIが登録されているか
   - `https://your-domain.com/api/auth/callback/google`

2. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` が本番用か確認

3. `AUTH_URL` が `https://your-domain.com` になっているか

### 問題: Passkey認証が動作しない

**確認事項:**

1. HTTPS が有効になっているか（WebAuthnはHTTPSが必須）

2. `NEXT_PUBLIC_WEBAUTHN_RP_ID` がドメイン名と一致しているか
   ```env
   NEXT_PUBLIC_WEBAUTHN_RP_ID="your-domain.com"
   ```

3. `NEXT_PUBLIC_WEBAUTHN_ORIGIN` が正しいか
   ```env
   NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://your-domain.com"
   ```

### 問題: SSL証明書エラー

**確認事項:**

1. Let's Encrypt 証明書の有効期限確認
   ```bash
   sudo certbot certificates
   ```

2. 証明書の更新
   ```bash
   sudo certbot renew
   sudo systemctl restart nginx
   ```

### 問題: useSecureCookies 関連エラー

**確認事項:**

1. `NODE_ENV` が `production` になっているか確認
   ```bash
   pm2 show ra9-app | grep NODE_ENV
   ```

2. Nginxで `X-Forwarded-Proto` ヘッダーが設定されているか確認
   ```nginx
   proxy_set_header X-Forwarded-Proto $scheme;
   ```

3. `auth.ts` で `trustHost: true` が設定されているか確認（リバースプロキシ使用時）

---

## 参考リソース

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Auth.js Production Checklist](https://authjs.dev/getting-started/deployment)

---

## まとめ

このガイドでは、さくらVPSへのデプロイ手順をステップバイステップで解説しました。

**重要なポイント:**

1. **NODE_ENVは自動設定される** - `npm start` を実行すると自動的に `production` になります
2. **HTTPSは必須** - Passkey認証、セキュアCookieのため
3. **環境変数の管理** - `.env.local` を適切に設定し、Gitにコミットしない
4. **セキュリティチェックリスト** - デプロイ前に必ず確認
5. **定期的なバックアップ** - データベースとファイルの両方

デプロイ後は、本番環境で動作確認を行い、問題があればログを確認してください。

---

**ドキュメント更新日**: 2025-11-07
