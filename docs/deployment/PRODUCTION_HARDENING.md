# 本番環境強化ガイド

このドキュメントは、基本的なデプロイ完了後に実施する、本番環境のセキュリティ強化と最適化の手順です。

**前提条件**: [DEPLOYMENT.md](./DEPLOYMENT.md) の手順が完了していること

**注意**: これらの設定は必須ではありません。基本デプロイで動作していれば、運用開始は可能です。

---

## 目次

1. [Nginxセキュリティ強化](#nginxセキュリティ強化)
2. [ログ管理の最適化](#ログ管理の最適化)

---

## Nginxセキュリティ強化

**Why（なぜ必要か）**:
- 現在のNginx設定にセキュリティヘッダーがなく、XSS、クリックジャッキング、MIME sniffing攻撃に脆弱
- レート制限がないため、DDoS攻撃やブルートフォース攻撃に対して無防備
- タイムアウト設定がなく、Slow Loris攻撃やネットワーク障害時にコネクションがハングする可能性
- 静的ファイルのキャッシュ設定がなく、毎回Next.jsサーバーにリクエストが届き、パフォーマンスが低下

**Purpose（何のために）**:
- セキュリティヘッダーを追加し、OWASP Top 10の脆弱性を軽減
- レート制限を設定し、悪意のあるトラフィックからサーバーを保護
- タイムアウトを設定し、リソース枯渇攻撃を防御
- 静的ファイルをキャッシュし、サーバー負荷とレスポンスタイムを削減

**Impact（影響）**:
- セキュリティ向上: XSS、クリックジャッキング、MIME sniffing攻撃の防御
- 可用性向上: DDoS攻撃、Slow Loris攻撃への耐性
- パフォーマンス向上: 静的ファイルのキャッシュで応答速度が5-10倍改善
- 運用コスト削減: サーバー負荷の低減

### セキュリティ強化版のNginx設定

`/etc/nginx/conf.d/ra.conf` を以下のように編集します。

#### 1. レート制限ゾーンの定義

**注意**: `limit_req_zone` ディレクティブは `http` コンテキストで定義する必要があります。
`/etc/nginx/nginx.conf` の `http` ブロック内、または `/etc/nginx/conf.d/ra9-rate-limit.conf` に配置してください。

```bash
# Recording Anniversaries 9 専用のレート制限設定ファイル
sudo nano /etc/nginx/conf.d/ra9-rate-limit.conf
```

```nginx
# Recording Anniversaries 9 専用のレート制限ゾーン
# 推奨: 最初は50r/sから開始し、実際の使用状況で調整
limit_req_zone $binary_remote_addr zone=ra9_api_limit:10m rate=50r/s;
```

#### 2. HTTP設定（ポート80）

```bash
sudo nano /etc/nginx/conf.d/ra.conf
```

```nginx
server {
    listen 80;
    server_name ra.takemitsu.net;

    # タイムアウト設定
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # レート制限（API・認証エンドポイント）
    location /api/ {
        limit_req zone=ra9_api_limit burst=20 nodelay;

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

    # 静的ファイルのキャッシュ（Next.js _next/static）
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";

        # セキュリティヘッダー
        add_header X-Content-Type-Options "nosniff" always;
    }

    # メインロケーション
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

        # セキュリティヘッダー
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    }
}
```

#### 3. HTTPS設定（ポート443）

certbot実行後、自動追加される443ブロックに以下を追加：

```nginx
server {
    listen 443 ssl http2;
    server_name ra.takemitsu.net;

    # SSL証明書（certbotが自動設定）
    ssl_certificate /etc/letsencrypt/live/takemitsu.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/takemitsu.net/privkey.pem;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # タイムアウト設定
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # レート制限（API・認証エンドポイント）
    location /api/ {
        limit_req zone=ra9_api_limit burst=20 nodelay;

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

    # 静的ファイルのキャッシュ
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
    }

    # メインロケーション
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

        # セキュリティヘッダー
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    }
}
```

### 設定のポイント

**1. レート制限**:
- `zone=ra9_api_limit:10m` - 10MBのメモリゾーン（約16万IPアドレス分）
- `rate=50r/s` - 1秒あたり50リクエスト（推奨: 最初は保守的に、実運用で調整）
- `burst=20 nodelay` - バースト20リクエストまで許可

**運用方針**:
- Nginxログで `limit_req` エラーを監視: `grep "limiting requests" /var/log/nginx/error.log`
- 実際の使用状況に応じて段階的に調整（厳しくする: 30r/s、緩くする: 100r/s）

**2. タイムアウト**:
- `proxy_connect_timeout: 60s` - バックエンド接続タイムアウト
- `proxy_send_timeout: 60s` - リクエスト送信タイムアウト
- `proxy_read_timeout: 60s` - レスポンス読み取りタイムアウト

**3. キャッシュ**:
- `/_next/static/` - Next.jsの静的ファイル（1年キャッシュ）
- `expires 1y` - ブラウザキャッシュ期間
- `Cache-Control "public, immutable"` - CDNとブラウザでキャッシュ

**4. セキュリティヘッダー**:
- `Strict-Transport-Security` - HTTPS強制（HSTS）
- `X-Frame-Options` - クリックジャッキング対策
- `X-Content-Type-Options` - MIME sniffing対策
- `Referrer-Policy` - リファラー情報の制御
- `Permissions-Policy` - 機能ポリシー（カメラ・マイク無効化）

**Content-Security-Policy（CSP）について**:
- Next.js 16では、厳格なnonceベースCSPを実装すると、全ページが動的レンダリングになり、Static Optimization、ISR、PPRが使えなくなります
- 小規模プロジェクトでは、他のセキュリティ層（Auth.js、Zod、React等）で十分保護されているため、CSPは設定していません
- 詳細: https://nextjs.org/docs/app/guides/content-security-policy

### 設定の適用

```bash
# 構文チェック
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx

# セキュリティヘッダーの確認
curl -I https://ra.takemitsu.net
```

---

## ログ管理の最適化

**Why（なぜ必要か）**:
- 現在のログは無制限に蓄積され、ディスク容量を圧迫する（PM2デフォルト: `~/.pm2/logs/`、ローテーションなし）
- pm2-logrotateはメンテナンスされておらず、バグが多い（PM2公式も非推奨）

**Purpose（何のために）**:
- native logrotateを使用し、ディスク容量を適切に管理（2025年のベストプラクティス）
- PM2公式推奨の方法でログローテーションを実現

**Impact（影響）**:
- 運用コスト削減: ディスク容量の適切な管理（7日で自動削除）
- 安定性向上: メンテナンスされているnative logrotateを使用
- トラブルシューティング効率の向上: ログの一元管理

### native logrotate設定（PM2公式推奨）

**VPS上で実行**:

```bash
# VPSにSSH接続
ssh ubuntu@takemitsu.net

# logrotate設定ファイルを作成
sudo nano /etc/logrotate.d/pm2-ubuntu
```

**設定内容**（`/etc/logrotate.d/pm2-ubuntu`）:

```bash
# PM2ログのローテーション設定
/home/ubuntu/.pm2/logs/*.log {
    daily                # 毎日ローテーション
    rotate 7             # 7日分保持（7世代）
    missingok            # ログファイルが存在しなくてもエラーにしない
    notifempty           # 空のログファイルはローテーションしない
    compress             # 古いログをgzip圧縮
    delaycompress        # 最新の古いログは圧縮しない（次回ローテーション時に圧縮）
    copytruncate         # ファイルをコピーしてから元のファイルを切り詰める（PM2再起動不要）
    su ubuntu ubuntu     # ubuntuユーザー権限で実行
}
```

### 設定のポイント

- `daily rotate 7` - 7日分のログを保持（ディスク容量を適切に管理）
- `compress` - 古いログをgzip圧縮（ディスク使用量を削減）
- `copytruncate` - PM2を再起動せずにローテーション実行
- `su ubuntu ubuntu` - PM2がubuntuユーザーで実行されているため、同じ権限で実行

### 設定のテスト

```bash
# logrotate設定のテスト（dry-run）
sudo logrotate -d /etc/logrotate.d/pm2-ubuntu

# 実際に実行（強制ローテーション）
sudo logrotate -f /etc/logrotate.d/pm2-ubuntu

# ログファイルの確認
ls -lh ~/.pm2/logs/
```

**注意**: logrotateは通常、`/etc/cron.daily/logrotate` により毎日自動実行されます。手動での設定は不要です。

---

## 参考リソース

- [Nginx Security Hardening Guide](https://www.secopsolution.com/blog/nginx-security-hardening-guide)
- [NGINX Security Headers, the right way](https://www.getpagespeed.com/server-setup/nginx-security-headers-the-right-way)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)
- [Linux Logrotate Documentation](https://linux.die.net/man/8/logrotate)

---

**ドキュメント作成日**: 2025-11-11
