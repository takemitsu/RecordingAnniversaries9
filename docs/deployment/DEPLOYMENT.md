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
- nginx: 1.28.0 (stable)
- 既存サービス: ra8 (ra.takemitsu.net), maji-kichi-meshi など
```

**注意**: PM2が未インストールの場合は、[PM2セットアップ](#pm2セットアップ)を参照してください。

### 必要な情報

- [ ] Google OAuth 本番用認証情報
- [ ] SSH接続用の認証情報
- [ ] MySQLのrootパスワード
- [ ] デプロイ先ドメイン（ra.takemitsu.net）

---

## デプロイ方針

このガイドでは、**既存ドメイン置き換え（ra.takemitsu.net）方式**を採用します。

### デプロイ方針の詳細

- **ドメイン**: `ra.takemitsu.net`（既存ドメインをそのまま使用）
- **ra8**: Nginx設定をra9に切り替え（ra8プロジェクトは残置）
- **データ移行**: **必須**（export/import方式、詳細は[データ移行](#データ移行ra8ra9)参照）
- **メリット**: ユーザーはドメイン変更不要、ブックマーク等そのまま利用可能
- **デメリット**: ダウンタイム発生（移行作業中）

### 注意事項

- ra8のデータは**export/import方式（JSON形式）**で移行します
- データ移行の詳細は [DATA_MIGRATION_JSON.md](./DATA_MIGRATION_JSON.md) を参照してください
- 移行作業中はサービスが停止します（ダウンタイム: 推定10-30分）

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
git clone https://github.com/takemitsu/RecordingAnniversaries9.git
cd RecordingAnniversaries9

# 本番ブランチにチェックアウト
git checkout main
```

### 2. 依存関係インストール

```bash
# VPS上でビルドする場合は devDependencies も必要
npm ci
```

**注意**: `npm ci --omit=dev`を使用すると、TypeScript等のdevDependenciesがインストールされず、ビルドに失敗します。VPS上でビルドする場合は、`npm ci`でdevDependenciesを含めて全てインストールしてください。

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

### 1. Nginx設定ファイル編集

既存の `/etc/nginx/conf.d/ra.conf` をバックアップして編集します：

```bash
# バックアップ（ra8設定を保存）
sudo cp /etc/nginx/conf.d/ra.conf /etc/nginx/conf.d/ra.conf.bak.ra8

# 編集
sudo nano /etc/nginx/conf.d/ra.conf
```

**設定内容**（ポート3000へのプロキシ）:

```nginx
server {
    listen 80;
    server_name ra.takemitsu.net;

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
curl http://ra.takemitsu.net

# 正常にHTMLが返ってくればOK
```

**本番環境のセキュリティ強化**: セキュリティヘッダー、レート制限、タイムアウト設定、キャッシュ設定等については、
デプロイ完了後に [PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md#nginx-security) を参照してください（オプション）。

---

## SSL証明書設定

### 既存証明書の確認

```bash
# 現在の証明書を確認
sudo certbot certificates
```

ra.takemitsu.netは既存の`takemitsu.net`証明書（マルチドメインまたはワイルドカード）でカバーされています。

### Nginx設定にSSL設定を追加

```bash
# ra.takemitsu.netのSSL設定を追加（既存証明書を自動検出）
sudo certbot --nginx -d ra.takemitsu.net
```

**実行時の動作**:
- 既存のtakemitsu.net証明書を自動検出
- プロンプトで既存証明書の使用を確認
- Nginx設定ファイル（ra.conf）に443ポートのSSL設定を自動追加

**注意**: `--force-renewal`は不要です。既存証明書をそのまま使用します。

### 自動更新設定確認

Certbotインストール時に自動更新が設定されています（手動設定不要）。

```bash
# systemdタイマーの確認
sudo systemctl status certbot.timer

# 自動更新のテスト
sudo certbot renew --dry-run
```

### HTTPS動作確認

```bash
curl https://ra.takemitsu.net

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
DATABASE_URL="mysql://ra9user:YOUR_STRONG_PASSWORD@localhost:3306/ra9"

# Auth.js Configuration
# 生成方法: openssl rand -base64 32
AUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
AUTH_URL="https://ra.takemitsu.net"

# Google OAuth（本番用認証情報）
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# WebAuthn (Passkey) Configuration
NEXT_PUBLIC_WEBAUTHN_RP_ID="ra.takemitsu.net"
NEXT_PUBLIC_WEBAUTHN_RP_NAME="Recording Anniversaries"
NEXT_PUBLIC_WEBAUTHN_ORIGIN="https://ra.takemitsu.net"

# Application
NEXT_PUBLIC_APP_NAME="Recording Anniversaries 9"
NEXT_PUBLIC_APP_URL="https://ra.takemitsu.net"

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

#### 3. Google OAuth 認証情報

**ra8で使用中の認証情報をそのまま使用します**（新規作成不要）。

ただし、リダイレクトURIが異なるため、Google Cloud Consoleで**追加**が必要です：

- ra8: `https://ra.takemitsu.net/auth/redirect/callback/google`
- ra9: `https://ra.takemitsu.net/api/auth/callback/google` ← **追加**

**手順**:

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. ra8で使用中のプロジェクトを選択
3. 「APIとサービス」→「認証情報」
4. 既存の「OAuth 2.0 クライアントID」を編集
5. 承認済みのリダイレクトURIに追加: `https://ra.takemitsu.net/api/auth/callback/google`
6. 既存の`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`をコピー（ra8の`.env`から取得可能）

#### 4. 環境変数のセキュリティ

```bash
# パーミッション設定
chmod 600 .env.local

# .gitignoreで除外されていることを確認
cat .gitignore | grep .env.local
```

---

## データ移行（ra8→ra9）

**このステップは必須です**

ra8側でエクスポートした`export.json`をプロジェクトルートにコピーしてから、以下を実行：

```bash
# 環境変数を明示的に指定してインポート
DATABASE_URL="mysql://ra9user:YOUR_PASSWORD@localhost:3306/ra9" npm run import:data export.json
```

**注意**: `import-data.ts`スクリプトは`.env.local`を自動読み込みしないため、`DATABASE_URL`を明示的に指定する必要があります。

詳細な手順は **[DATA_MIGRATION_JSON.md](./DATA_MIGRATION_JSON.md)** を参照してください。

---

## CI/CD自動デプロイ（オプション）

GitHub Actionsを使った自動デプロイを設定することで、main ブランチへのpush時に自動的に本番環境へデプロイできます。

**CI/CD設定は必須ではありません**。上記の手動デプロイ手順でも十分に運用可能です。

**CI/CD設定の詳細手順**: GitHub Actions、GitHub Secrets、SSH鍵設定、ワークフローファイル等については、
[CI_CD_SETUP.md](./CI_CD_SETUP.md) を参照してください。

---

## 運用・メンテナンス

デプロイ後の日常的な運用手順については、以下のドキュメントを参照してください：

- **[OPERATIONS.md](../operations/OPERATIONS.md)** - アプリケーション更新、ログ確認、バックアップ、PM2管理

**ログローテーション設定**: PM2ログの自動ローテーション設定については、
デプロイ完了後に [PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md#log-management) を参照してください（オプション）。

---

## セキュリティチェックリスト

本番環境デプロイ前のセキュリティチェック項目については、以下のドキュメントを参照してください：

- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - HTTPS設定、環境変数、データベース、ファイアウォール、Auth.js設定など

---

## PM2自動起動の詳細設定

PM2の自動起動設定で`protocol`エラーが発生する場合は、systemdサービスファイルの`Type`を変更します。

### 問題と解決方法

**問題**: `pm2 startup`実行後、`systemctl start pm2-ubuntu`で`protocol`エラーが発生

**原因**: デフォルトの`Type=forking`がPM2の動作と合わない

**解決**: `/etc/systemd/system/pm2-ubuntu.service`を編集

```bash
sudo vim /etc/systemd/system/pm2-ubuntu.service
```

以下の2行を修正：

```ini
# 変更前
Type=forking
PIDFile=/home/ubuntu/.pm2/pm2.pid

# 変更後
Type=oneshot
RemainAfterExit=yes
# PIDFile行を削除またはコメントアウト
```

変更後、systemdを再読み込み：

```bash
sudo systemctl daemon-reload
sudo systemctl restart pm2-ubuntu
systemctl status pm2-ubuntu  # Active: active (exited) を確認
```

### MySQLの後にPM2を起動する設定（推奨）

```bash
sudo vim /etc/systemd/system/pm2-ubuntu.service
```

`After`行を修正：

```ini
After=network.target mysql.service
```

これにより、データベース起動後にアプリケーションが起動し、DB接続エラーを防ぎます。

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

1. **デプロイドメイン**: ra.takemitsu.net（既存ドメイン置き換え方式）
2. **データ移行は必須**: export/import方式（JSON形式）でra8からデータ移行
3. **NODE_ENVは自動設定**: `npm start` を実行すると自動的に `production` になります
4. **HTTPSは必須**: Passkey認証、セキュアCookieのため
5. **環境変数の管理**: `.env.local` を適切に設定し、Gitにコミットしない
6. **CI/CD**: GitHub Actions で自動テスト・自動デプロイを実現
7. **セキュリティチェックリスト**: デプロイ前に必ず確認
8. **定期的なバックアップ**: データベースとファイルの両方

デプロイ後は、本番環境で動作確認を行い、問題があればログを確認してください。

---

## デプロイ実績

**初回デプロイ完了**: 2025-11-11

- ✅ さくらVPS（Ubuntu 24.04.3 LTS）
- ✅ ドメイン: https://ra.takemitsu.net
- ✅ データ移行成功: 5ユーザー、15 Collections、36 Anniversaries
- ✅ PM2自動起動設定完了（systemd管理）
- ✅ 全機能動作確認済み

**所要時間**: 約2時間（環境確認からデプロイ完了まで）

---

**ドキュメント作成日**: 2025-11-07
**最終更新日**: 2025-11-11（実際のデプロイ知見を反映）
