# 本番環境デプロイガイド

Recording Anniversaries 9 を既存のさくらVPS環境にデプロイする手順書です。

## 目次

1. [前提条件](#前提条件)
2. [デプロイパターン選択](#デプロイパターン選択)
3. [PM2セットアップ](#pm2セットアップ)
4. [データベースセットアップ](#データベースセットアップ)
5. [アプリケーションデプロイ](#アプリケーションデプロイ)
6. [Nginx設定](#nginx設定)
7. [SSL証明書設定](#ssl証明書設定)
8. [環境変数設定](#環境変数設定)
9. [データ移行（ra8→ra9）](#データ移行ra8ra9) → 詳細は [DATA_MIGRATION.md](./DATA_MIGRATION.md)
10. [CI/CD設定](#cicd設定)
11. [運用・メンテナンス](#運用メンテナンス) → 詳細は [OPERATIONS.md](../operations/OPERATIONS.md)
12. [セキュリティチェックリスト](#セキュリティチェックリスト) → 詳細は [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
13. [トラブルシューティング](#トラブルシューティング) → 詳細は [TROUBLESHOOTING.md](../operations/TROUBLESHOOTING.md)

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
- 既存サービス: ra8 (ra.takemitsu.net), maji-kichi-meshi など
```

**注意**: PM2が未インストールの場合は、[PM2セットアップ](#pm2セットアップ)を参照してください。

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

## PM2セットアップ

PM2（Process Manager 2）は、Node.jsアプリケーションをデーモン化して管理するツールです。

### 1. PM2インストール確認

```bash
# PM2がインストール済みか確認
pm2 --version
```

**インストール済みの場合**: バージョン番号が表示される → 次のセクション（データベースセットアップ）へ進む

**未インストールの場合**: `command not found` が表示される → 以下の手順でインストール

### 2. PM2インストール

```bash
# グローバルインストール
sudo npm install -g pm2

# バージョン確認
pm2 --version

# 自動起動設定
pm2 startup
# ↑ 表示されたコマンドをコピーして実行
```

**例**:
```bash
$ pm2 startup
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# ↑ このコマンドをコピーして実行
```

### 3. PM2動作確認

```bash
# 現在起動中のプロセス確認
pm2 list

# PM2の状態確認
pm2 status
```

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

# 本番ブランチにチェックアウト
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

ra8とra9はスキーマが大きく異なるため、**単純なmysqldumpでは移行できません**。

詳細な手順は **[DATA_MIGRATION.md](./DATA_MIGRATION.md)** を参照してください。

### 概要

**移行できるもの**:
- ✅ users（BIGINT → UUID変換）
- ✅ entities → collections
- ✅ days → anniversaries

**移行できないもの**:
- ❌ Google OAuth連携 → Auth.jsで再連携が必要
- ❌ sessions → 再ログインが必要
- ❌ webauthn_credentials → Passkey再登録が必要

詳細は [DATA_MIGRATION.md](./DATA_MIGRATION.md) を参照。

---

## CI/CD設定

GitHub Actionsを使用した自動デプロイ設定です。

### 概要

以下のワークフローを実装します（Git Flow）：

1. **自動テスト**: develop/main へのPR作成時・push時、Lint/TypeCheck/Test を自動実行（.github/workflows/ci.yml）
2. **自動デプロイ**: main ブランチへのpush時、本番環境へ自動デプロイ（.github/workflows/deploy.yml）
3. **手動デプロイ**: GitHub UI から手動でデプロイトリガー

**ブランチ戦略**: Git Flow
- 開発ブランチ → PR → develop（CI） → PR → main（CI + 自動デプロイ）

### 1. GitHub Secrets 設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下を追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `VPS_HOST` | VPSのホスト名 | `takemitsu.net` |
| `VPS_USER` | SSHユーザー名 | `ubuntu` |
| `VPS_SSH_KEY` | SSH秘密鍵 | （秘密鍵の内容全体） |
| `PRODUCTION_ENV` | 本番環境変数ファイル | [後述のフォーマット参照](#production_env-の中身) |

**SSH秘密鍵の取得方法**:

```bash
# ローカルマシンで秘密鍵の内容をコピー
cat ~/.ssh/id_rsa
# または
cat ~/.ssh/id_ed25519
```

#### PRODUCTION_ENV の中身

`PRODUCTION_ENV` Secretには、本番環境の `.env.local` の内容をそのまま設定します：

```env
DATABASE_URL="mysql://ra9user:YOUR_STRONG_PASSWORD@127.0.0.1:3306/ra9"
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://ra9.takemitsu.net"
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"
NEXT_PUBLIC_WEBAUTHN_RP_ID="ra9.takemitsu.net"
NEXT_PUBLIC_WEBAUTHN_RP_NAME="Recording Anniversaries"
NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://ra9.takemitsu.net"
NEXT_PUBLIC_APP_NAME="Recording Anniversaries 9"
NEXT_PUBLIC_APP_URL="https://ra9.takemitsu.net"
TZ="Asia/Tokyo"
NEXT_TELEMETRY_DISABLED=1
```

**注意**:
- 改行を含めてそのまま貼り付ける
- GitHub Secretsでは値が暗号化され、ログには表示されない
- deploy.ymlで `cat << 'EOF' > .env.local` により展開される

### 2. GitHub Actions ワークフローファイル

ワークフローファイルは既にリポジトリに含まれています：

- **`.github/workflows/ci.yml`**: 自動テスト（develop/main へのPR・push時）
- **`.github/workflows/deploy.yml`**: 自動デプロイ（main へのpush時）

**ファイルの内容は直接参照してください**：
- [ci.yml](../../.github/workflows/ci.yml)
- [deploy.yml](../../.github/workflows/deploy.yml)

**主要な設定**:
- ci.yml: `branches: [ develop, main ]`
- deploy.yml: `branches: [ main ]`、Secrets検証あり

### 3. E2Eテスト除外（CI環境）

E2EテストはCI環境では実行しない（ブラウザが必要なため）。必要に応じて `.github/workflows/ci.yml` に以下を追加：

```yaml
      - name: Run E2E Tests (optional)
        if: false  # CI環境ではスキップ
        run: npm run test:e2e
```

### 4. 手動デプロイの実行方法

#### GitHub Actions経由（推奨）

1. GitHubリポジトリページで「Actions」タブをクリック
2. 左サイドバーから「Deploy to Production」を選択
3. 「Run workflow」ボタンをクリック
4. ブランチ（main）を選択して実行

#### VPS上で直接実行（緊急時）

GitHub Actionsが使えない場合やテスト目的で、VPS上で直接デプロイ可能：

```bash
# VPSにSSH接続
ssh ubuntu@takemitsu.net

# プロジェクトディレクトリに移動
cd ~/recording-anniversaries9

# Gitから最新版を取得
git pull origin main

# 依存関係を更新
npm ci --omit=dev

# 環境変数ファイルを設定（手動で編集）
nano .env.local
# または既存の .env.local をそのまま使う

# パーミッション設定
chmod 600 .env.local

# ビルド
npm run build

# データベースマイグレーション（必要に応じて）
npm run db:migrate

# PM2でアプリケーションを再起動
pm2 restart ra9-app || pm2 start npm --name "ra9-app" -- start

# ログ確認
pm2 logs ra9-app --lines 50
```

**注意**: 手動デプロイの場合、`.env.local` は事前にVPS上に作成・配置しておく必要があります。

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

### CI/CD フロー図（Git Flow）

```
開発ブランチ → PR（→ develop） → 自動テスト（CI）
                                    ↓
                                    ✅ Pass → マージ可能
                                    ❌ Fail → 修正が必要
                                    ↓
                                 マージ → develop
                                    ↓
                              （開発環境で動作確認）
                                    ↓
                        develop → PR（→ main） → 自動テスト（CI）
                                                    ↓
                                                    ✅ Pass
                                                    ↓
                                                 マージ → main
                                                    ↓
                                                自動デプロイ
                                                    ↓
                                            1. git pull origin main
                                            2. npm ci --omit=dev
                                            3. 環境変数更新（PRODUCTION_ENV）
                                            4. npm run build
                                            5. npm run db:migrate
                                            6. pm2 restart ra9-app
                                                    ↓
                                            ✅ デプロイ完了

手動トリガー → GitHub UI から実行（main branch）
```

**メリット**:
- develop でテストしてから本番（main）へ
- リリース管理が厳格
- 本番環境への影響を最小化

---

## 運用・メンテナンス

デプロイ後の日常的な運用手順については、以下のドキュメントを参照してください：

- **[OPERATIONS.md](../operations/OPERATIONS.md)** - アプリケーション更新、ログ確認、バックアップ、PM2管理

---

## セキュリティチェックリスト

本番環境デプロイ前のセキュリティチェック項目については、以下のドキュメントを参照してください：

- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - HTTPS設定、環境変数、データベース、ファイアウォール、Auth.js設定など

---

## トラブルシューティング

本番環境で問題が発生した場合は、以下のドキュメントを参照してください：

- **[TROUBLESHOOTING.md](../operations/TROUBLESHOOTING.md)** - アプリケーション起動失敗、データベース接続エラー、OAuth/Passkey認証、SSL証明書、デプロイ失敗など

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
