# 本番環境デプロイガイド

Recording Anniversaries 9 を既存のさくらVPS環境にデプロイする手順書です。

## 目次

1. [前提条件](#前提条件)
2. [デプロイパターン選択](#デプロイパターン選択)
3. [データベースセットアップ](#データベースセットアップ)
4. [アプリケーションデプロイ](#アプリケーションデプロイ)
5. [Nginx設定](#nginx設定)
6. [SSL証明書設定](#ssl証明書設定)
7. [環境変数設定](#環境変数設定)
8. [データ移行（ra8→ra9）](#データ移行ra8ra9)
9. [CI/CD設定](#cicd設定)
10. [運用・メンテナンス](#運用メンテナンス)
11. [セキュリティチェックリスト](#セキュリティチェックリスト)
12. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 既存環境

以下の環境が既にセットアップ済みであることを前提とします：

```
- OS: Ubuntu 24.04.3 LTS
- Node.js: v20.19.5
- npm: 10.8.2
- MySQL: 8.0.43
- nginx: 1.28.0
- PM2: インストール済み
- 既存サービス: ra8 (ra.takemitsu.net), maji-kichi-meshi など
```

### 必要な情報

- [ ] Google OAuth 本番用認証情報
- [ ] SSH接続用の認証情報
- [ ] MySQLのrootパスワード
- [ ] デプロイ先ドメイン（ra9.takemitsu.net または ra.takemitsu.net）

---

## デプロイパターン選択

ra9のデプロイには2つのパターンがあります。どちらを選択するか決定してください。

### パターンA: 新規ドメイン（ra9.takemitsu.net）

**ra8と並行運用する場合**

- ドメイン: `ra9.takemitsu.net`
- ra8: `ra.takemitsu.net` のまま継続運用
- データ移行: 不要（新規環境として構築）
- メリット: ra8への影響なし、切り戻し容易
- デメリット: ドメイン変更が必要

### パターンB: 既存ドメイン置き換え（ra.takemitsu.net）

**ra8を停止してra9に置き換える場合**

- ドメイン: `ra.takemitsu.net`
- ra8: 停止・削除
- データ移行: 必要（ra8→ra9）
- メリット: ドメイン変更不要
- デメリット: ダウンタイム発生、後戻り困難

**このガイドではパターンA（新規ドメイン）を前提に記載しますが、パターンBの手順も[データ移行](#データ移行ra8ra9)セクションで説明します。**

---

## データベースセットアップ

### 1. データベース作成

```bash
# MySQLにログイン
sudo mysql -u root -p

# データベース作成
CREATE DATABASE ra9 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# ユーザー作成と権限付与（既存ユーザーがいれば再利用可）
CREATE USER 'ra9user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON ra9.* TO 'ra9user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**注意**: DB名は `ra9`（`ra9_production` ではありません）

### 2. データベース接続確認

```bash
mysql -u ra9user -p ra9
# パスワード入力後、接続できればOK
EXIT;
```

---

## アプリケーションデプロイ

### 1. リポジトリクローン

```bash
# ホームディレクトリに移動
cd ~

# Gitクローン
git clone https://github.com/YOUR_USERNAME/recording-anniversaries9.git
cd recording-anniversaries9

# 本番ブランチにチェックアウト（mainまたはproduction）
git checkout main
```

### 2. 依存関係インストール

```bash
npm ci --omit=dev
```

### 3. 環境変数設定

`.env.local` ファイルを作成（**詳細は[環境変数設定](#環境変数設定)セクション参照**）:

```bash
nano .env.local
```

### 4. ビルド

```bash
npm run build
```

**重要**: `npm run build` 実行時、Next.jsは自動的に `NODE_ENV=production` を設定します。

### 5. データベースマイグレーション

```bash
npm run db:migrate
```

**重要**: `npm run db:migrate` を使用すること（`npx drizzle-kit migrate` は環境変数読み込みに問題あり）

### 6. PM2でアプリケーション起動

```bash
# PM2でNext.jsサーバーを起動
pm2 start npm --name "ra9-app" -- start

# 起動確認
pm2 list

# ログ確認
pm2 logs ra9-app --lines 50

# 自動起動設定を保存
pm2 save
```

### 7. 動作確認

```bash
# ローカルでアクセス確認
curl http://localhost:3000

# 正常にHTMLが返ってくればOK
```

---

## Nginx設定

### 1. Nginx設定ファイル作成

```bash
sudo nano /etc/nginx/conf.d/ra9.conf
```

**パターンA: ra9.takemitsu.net の場合**

```nginx
server {
    listen 80;
    server_name ra9.takemitsu.net;

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

**パターンB: ra.takemitsu.net の場合**

既存の `/etc/nginx/conf.d/ra.conf` をバックアップして編集：

```bash
# バックアップ
sudo cp /etc/nginx/conf.d/ra.conf /etc/nginx/conf.d/ra.conf.bak.ra8

# 編集（ra8 → ra9 に変更）
sudo nano /etc/nginx/conf.d/ra.conf
```

内容はパターンAと同様（ポート3000へのプロキシ）

### 2. 設定ファイルのテスト

```bash
# 構文チェック
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx
```

### 3. 動作確認

```bash
# HTTPアクセス確認（まだHTTPS化前）
curl http://ra9.takemitsu.net

# 正常にHTMLが返ってくればOK
```

---

## SSL証明書設定

### Let's Encrypt で証明書取得

```bash
# Certbotで証明書取得
sudo certbot --nginx -d ra9.takemitsu.net

# プロンプトに従ってメールアドレスを入力、規約に同意
```

**パターンB（ra.takemitsu.net）の場合**:

```bash
# 既存証明書を更新（ドメインが同じなので再取得）
sudo certbot renew
```

### 自動更新設定確認

```bash
# 自動更新のテスト
sudo certbot renew --dry-run

# Cronジョブ確認（通常は自動設定済み）
sudo crontab -l | grep certbot
```

### HTTPS動作確認

```bash
curl https://ra9.takemitsu.net

# HTTPSでアクセスできればOK
```

---

## 環境変数設定

`.env.local` に以下を設定（本番環境用）:

```env
# ========================================
# 本番環境変数設定
# ========================================

# Database Configuration
DATABASE_URL="mysql://ra9user:YOUR_STRONG_PASSWORD@127.0.0.1:3306/ra9"

# Auth.js Configuration
# 生成方法: openssl rand -base64 32
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://ra9.takemitsu.net"
# パターンB: AUTH_URL="https://ra.takemitsu.net"

# Google OAuth（本番用認証情報）
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# WebAuthn (Passkey) Configuration
NEXT_PUBLIC_WEBAUTHN_RP_ID="ra9.takemitsu.net"
NEXT_PUBLIC_WEBAUTHN_RP_NAME="Recording Anniversaries"
NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://ra9.takemitsu.net"
# パターンB: RP_ID="ra.takemitsu.net", ORIGIN="https://ra.takemitsu.net"

# Application
NEXT_PUBLIC_APP_NAME="Recording Anniversaries 9"
NEXT_PUBLIC_APP_URL="https://ra9.takemitsu.net"
# パターンB: NEXT_PUBLIC_APP_URL="https://ra.takemitsu.net"

# Timezone
TZ="Asia/Tokyo"

# Next.js Telemetry（無効化）
NEXT_TELEMETRY_DISABLED=1
```

### 重要ポイント

#### 1. NODE_ENV について

**Next.jsが自動設定します**（手動設定不要）:

- `npm run dev` → `NODE_ENV=development`
- `npm run build` → `NODE_ENV=production`
- `npm start` → `NODE_ENV=production`

**影響**:
- `useSecureCookies: process.env.NODE_ENV === "production"` により、本番環境では自動的に `true`
- Cookie名: 本番では `__Secure-authjs.session-token`（HTTPS必須）

#### 2. AUTH_SECRET 生成

```bash
openssl rand -base64 32
```

#### 3. Google OAuth 本番用認証情報

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト作成（または既存プロジェクト選択）
3. 「APIとサービス」→「認証情報」
4. 「OAuth 2.0 クライアントID」を作成
5. 承認済みのリダイレクトURI:
   - パターンA: `https://ra9.takemitsu.net/api/auth/callback/google`
   - パターンB: `https://ra.takemitsu.net/api/auth/callback/google`

#### 4. 環境変数のセキュリティ

```bash
# パーミッション設定
chmod 600 .env.local

# .gitignoreで除外されていることを確認
cat .gitignore | grep .env.local
```

---

## データ移行（ra8→ra9）

**パターンB（ra.takemitsu.netに置き換え）を選択した場合のみ実施**

### 1. ra8のデータエクスポート

```bash
# ra8のデータベースダンプを作成
mysqldump -u ra8user -p ra8_database > ~/ra8_backup_$(date +%Y%m%d).sql

# ダンプファイルを確認
ls -lh ~/ra8_backup_*.sql
```

### 2. ra9へインポート

```bash
# ra9データベースにインポート
mysql -u ra9user -p ra9 < ~/ra8_backup_YYYYMMDD.sql
```

### 3. スキーマ差分の確認・調整

ra8とra9でスキーマが異なる場合、マイグレーションを実行：

```bash
cd ~/recording-anniversaries9
npm run db:migrate
```

### 4. データ整合性確認

```bash
# MySQLにログイン
mysql -u ra9user -p ra9

# テーブル確認
SHOW TABLES;

# データ件数確認
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM collections;
SELECT COUNT(*) FROM anniversaries;

EXIT;
```

### 5. ra8停止

データ移行が完了し、ra9の動作確認ができたら、ra8を停止：

```bash
# PM2でra8を停止
pm2 stop ra8-app
pm2 delete ra8-app

# PM2設定保存
pm2 save
```

### 6. Nginx設定更新

```bash
# ra.conf を ra9用に変更（ポート3000 → ra9のポート）
sudo nano /etc/nginx/conf.d/ra.conf

# Nginx再起動
sudo systemctl restart nginx
```

---

## CI/CD設定

GitHub Actionsを使用した自動デプロイ設定です。

### 概要

以下のワークフローを実装します：

1. **自動テスト**: PR作成時、Lint/TypeCheck/Test を自動実行
2. **自動デプロイ**: main ブランチへのマージ時、本番環境へ自動デプロイ
3. **手動デプロイ**: GitHub UI から手動でデプロイトリガー

### 1. GitHub Secrets 設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下を追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `VPS_HOST` | VPSのホスト名 | `takemitsu.net` |
| `VPS_USER` | SSHユーザー名 | `ubuntu` |
| `VPS_SSH_KEY` | SSH秘密鍵 | （秘密鍵の内容全体） |
| `PRODUCTION_ENV` | 本番環境変数ファイル | （.env.local の内容全体） |

**SSH秘密鍵の取得方法**:

```bash
# ローカルマシンで秘密鍵の内容をコピー
cat ~/.ssh/id_rsa
# または
cat ~/.ssh/id_ed25519
```

### 2. GitHub Actions ワークフローファイル作成

`.github/workflows/ci.yml` を作成：

```yaml
name: CI

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: ra9_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

      - name: Create test env file
        run: |
          cat << EOF > .env.local
          DATABASE_URL="mysql://root:password@127.0.0.1:3306/ra9_test"
          TEST_DATABASE_URL="mysql://root:password@127.0.0.1:3306/ra9_test"
          AUTH_SECRET="test-secret-key-for-ci"
          AUTH_URL="http://localhost:3000"
          GOOGLE_CLIENT_ID="test"
          GOOGLE_CLIENT_SECRET="test"
          NEXT_PUBLIC_WEBAUTHN_RP_ID="localhost"
          NEXT_PUBLIC_WEBAUTHN_RP_NAME="Test"
          NEXT_PUBLIC_WEBAUTHN_ORIGIN="http://localhost:3000"
          NEXT_PUBLIC_APP_NAME="Test"
          NEXT_PUBLIC_APP_URL="http://localhost:3000"
          TZ="Asia/Tokyo"
          NEXT_TELEMETRY_DISABLED=1
          EOF

      - name: Run Tests
        run: npm test

      - name: Build
        run: npm run build
```

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # 手動デプロイトリガー

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e

            echo "🚀 Starting deployment..."

            # プロジェクトディレクトリに移動
            cd ~/recording-anniversaries9

            # Gitから最新版を取得
            echo "📦 Pulling latest code..."
            git pull origin main

            # 依存関係を更新
            echo "📦 Installing dependencies..."
            npm ci --omit=dev

            # 環境変数ファイルを更新（GitHub Secretsから）
            echo "🔧 Updating environment variables..."
            cat << 'EOF' > .env.local
            ${{ secrets.PRODUCTION_ENV }}
            EOF
            chmod 600 .env.local

            # ビルド
            echo "🏗️  Building application..."
            npm run build

            # データベースマイグレーション
            echo "🗄️  Running database migrations..."
            npm run db:migrate

            # PM2でアプリケーションを再起動
            echo "♻️  Restarting application..."
            pm2 restart ra9-app || pm2 start npm --name "ra9-app" -- start

            # ログ確認
            echo "📋 Application logs:"
            pm2 logs ra9-app --lines 20 --nostream

            echo "✅ Deployment complete!"
```

### 3. E2Eテスト除外（CI環境）

E2EテストはCI環境では実行しない（ブラウザが必要なため）。必要に応じて `.github/workflows/ci.yml` に以下を追加：

```yaml
      - name: Run E2E Tests (optional)
        if: false  # CI環境ではスキップ
        run: npm run test:e2e
```

### 4. 手動デプロイの実行方法

1. GitHubリポジトリページで「Actions」タブをクリック
2. 左サイドバーから「Deploy to Production」を選択
3. 「Run workflow」ボタンをクリック
4. ブランチ（main）を選択して実行

### 5. デプロイ通知（オプション）

Slack通知を追加する場合、`.github/workflows/deploy.yml` に追加：

```yaml
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to ra9.takemitsu.net'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Slack Webhook URLを GitHub Secrets に追加してください。

### 6. ロールバック手順

デプロイ後に問題が発生した場合のロールバック：

```bash
# VPSにSSH接続
cd ~/recording-anniversaries9

# 前のコミットに戻す
git log --oneline -5  # コミット履歴確認
git reset --hard <前のコミットハッシュ>

# 再ビルド・再起動
npm run build
pm2 restart ra9-app
```

### CI/CD フロー図

```
PR作成 → 自動テスト（Lint/TypeCheck/Test/Build）
  ↓
  ✅ Pass → マージ可能
  ❌ Fail → 修正が必要

main マージ → 自動デプロイ
  ↓
  1. git pull
  2. npm ci
  3. npm run build
  4. npm run db:migrate
  5. pm2 restart
  ↓
  ✅ デプロイ完了

手動トリガー → GitHub UI から実行
```

---

## 運用・メンテナンス

### アプリケーション更新

**手動デプロイの場合**:

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
pm2 logs ra9-app --lines 50
```

**CI/CDの場合**: GitHub上で main ブランチにマージするだけ

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
pm2 logs ra9-app --lines 100

# Nginxログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQLログ
sudo tail -f /var/log/mysql/error.log
```

### バックアップ

**データベースバックアップ**:

```bash
# バックアップディレクトリ作成
mkdir -p ~/backups

# SQLダンプ作成
mysqldump -u ra9user -p ra9 > ~/backups/ra9_$(date +%Y%m%d_%H%M%S).sql

# 定期的な自動バックアップ（cron）
crontab -e
# 毎日午前3時にバックアップ
0 3 * * * mysqldump -u ra9user -pYOUR_PASSWORD ra9 > ~/backups/ra9_$(date +\%Y\%m\%d).sql
```

**ファイルバックアップ**:

```bash
# アプリケーションディレクトリのバックアップ（.env.localを含む）
tar -czf ~/backups/ra9_app_$(date +%Y%m%d).tar.gz ~/recording-anniversaries9 --exclude=node_modules --exclude=.next
```

### PM2プロセス管理

```bash
# ステータス確認
pm2 list

# 特定アプリの詳細
pm2 show ra9-app

# 再起動
pm2 restart ra9-app

# 停止
pm2 stop ra9-app

# 起動
pm2 start ra9-app

# 削除
pm2 delete ra9-app

# 全プロセス再起動
pm2 restart all

# メモリ使用量監視
pm2 monit
```

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
- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] GitHub Secrets が適切に設定されている（CI/CD使用時）

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

### 6. サーバーセキュリティ

- [ ] サーバーのセキュリティアップデート
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- [ ] SSH鍵認証を使用し、パスワード認証を無効化
- [ ] fail2ban などの侵入検知システム導入（推奨）

### 7. アプリケーションセキュリティ

- [ ] 本番環境で `NODE_ENV=production` が設定されている
- [ ] 不要なログ出力を無効化
- [ ] CORS設定が適切（必要に応じて）

---

## トラブルシューティング

### 問題: アプリケーションが起動しない

**確認事項**:

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

4. ビルドが成功しているか
   ```bash
   ls -la .next/
   ```

### 問題: データベース接続エラー

**確認事項**:

1. MySQLが起動しているか
   ```bash
   sudo systemctl status mysql
   ```

2. `DATABASE_URL` が正しいか確認

3. データベースユーザーの権限確認
   ```sql
   SHOW GRANTS FOR 'ra9user'@'localhost';
   ```

4. データベースが存在するか
   ```bash
   mysql -u ra9user -p -e "SHOW DATABASES;"
   ```

### 問題: Google OAuth ログインができない

**確認事項**:

1. Google Cloud Consoleで本番ドメインのリダイレクトURIが登録されているか
   - `https://ra9.takemitsu.net/api/auth/callback/google`

2. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` が本番用か確認

3. `AUTH_URL` が `https://ra9.takemitsu.net` になっているか

4. ブラウザのコンソールエラーを確認

### 問題: Passkey認証が動作しない

**確認事項**:

1. HTTPS が有効になっているか（WebAuthnはHTTPSが必須）

2. `NEXT_PUBLIC_WEBAUTHN_RP_ID` がドメイン名と一致しているか
   ```env
   NEXT_PUBLIC_WEBAUTHN_RP_ID="ra9.takemitsu.net"
   ```

3. `NEXT_PUBLIC_WEBAUTHN_ORIGIN` が正しいか
   ```env
   NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://ra9.takemitsu.net"
   ```

4. ブラウザがWebAuthnをサポートしているか確認

### 問題: SSL証明書エラー

**確認事項**:

1. Let's Encrypt 証明書の有効期限確認
   ```bash
   sudo certbot certificates
   ```

2. 証明書の更新
   ```bash
   sudo certbot renew
   sudo systemctl restart nginx
   ```

3. Nginx設定ファイルの構文確認
   ```bash
   sudo nginx -t
   ```

### 問題: デプロイ後にサイトが表示されない

**確認事項**:

1. PM2でアプリケーションが起動しているか
   ```bash
   pm2 list
   pm2 logs ra9-app
   ```

2. Nginxが起動しているか
   ```bash
   sudo systemctl status nginx
   ```

3. ファイアウォールでポート80/443が開いているか
   ```bash
   sudo ufw status
   ```

4. DNS設定が正しいか
   ```bash
   dig ra9.takemitsu.net
   ```

### 問題: CI/CDデプロイが失敗する

**確認事項**:

1. GitHub Secrets が正しく設定されているか
   - VPS_HOST, VPS_USER, VPS_SSH_KEY, PRODUCTION_ENV

2. SSH鍵が正しいか（ローカルで接続テスト）
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@takemitsu.net
   ```

3. GitHub Actions のログを確認
   - リポジトリ → Actions → 失敗したワークフロー → ログ確認

4. VPS側のディスク容量確認
   ```bash
   df -h
   ```

---

## 参考リソース

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Auth.js Production Checklist](https://authjs.dev/getting-started/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## まとめ

このガイドでは、既存のさくらVPS環境にra9をデプロイする手順を説明しました。

**重要なポイント**:

1. **デプロイパターン選択**: ra9.takemitsu.net（新規）または ra.takemitsu.net（置き換え）
2. **NODE_ENVは自動設定**: `npm start` を実行すると自動的に `production` になります
3. **HTTPSは必須**: Passkey認証、セキュアCookieのため
4. **環境変数の管理**: `.env.local` を適切に設定し、Gitにコミットしない
5. **CI/CD**: GitHub Actions で自動テスト・自動デプロイを実現
6. **セキュリティチェックリスト**: デプロイ前に必ず確認
7. **定期的なバックアップ**: データベースとファイルの両方

デプロイ後は、本番環境で動作確認を行い、問題があればログを確認してください。

---

**ドキュメント更新日**: 2025-11-07
