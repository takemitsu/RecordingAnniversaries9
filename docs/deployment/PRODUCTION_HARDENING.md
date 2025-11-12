# 本番環境強化ガイド

このドキュメントは、基本的なデプロイ完了後に実施する、本番環境のセキュリティ強化と最適化の手順です。

**前提条件**: [DEPLOYMENT.md](./DEPLOYMENT.md) の手順が完了していること

**注意**: これらの設定は必須ではありません。基本デプロイで動作していれば、運用開始は可能です。

---

## 実績データ

**実施完了日**: 2025-11-12

| 項目 | ステータス | 内容 |
|------|----------|------|
| **ログローテーション** | ✅ 完了 | logrotate設定（7日分保持、自動圧縮） |
| **セキュリティヘッダー** | ✅ 完了 | HSTS, X-Frame-Options, X-Content-Type-Options |
| **レート制限** | ⏸️ 未実施 | 個人プロジェクト（5ユーザー）のため不要と判断 |
| **静的ファイルキャッシュ** | ⏸️ 未実施 | トラフィック少ないため効果薄いと判断 |

**実施理由**:
- ログローテーション: ディスク容量枯渇の予防（必須）
- セキュリティヘッダー: 2025年Webセキュリティ最低ライン

**動作確認**:
```bash
# ログローテーション設定確認
$ sudo logrotate -d /etc/logrotate.d/pm2-ubuntu
rotating pattern: /home/ubuntu/.pm2/logs/*.log  after 1 days (7 rotations)
✅ 設定成功

# セキュリティヘッダー確認
$ curl -I https://ra.takemitsu.net
strict-transport-security: max-age=63072000
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
✅ 正常動作
```

---

## 目次

1. [Nginxセキュリティ強化](#nginxセキュリティ強化)
2. [ログ管理の最適化](#ログ管理の最適化)

---

## Nginxセキュリティ強化

### 実施済み：最小限のセキュリティヘッダー（2025-11-12）

**実施内容**：
- 2025年Webセキュリティ最低ライン（HSTS, X-Frame-Options, X-Content-Type-Options）
- 既存設定に3行追加のみ

**実施理由**：
- 個人プロジェクト（5ユーザー）には最小限で十分
- レート制限・キャッシュは効果薄い（トラフィック少ない）

#### 設定手順

**1. Nginx設定ファイルを編集**：

```bash
sudo nano /etc/nginx/conf.d/ra.conf
```

**2. `location /` ブロック内に3行追加**：

```nginx
server {
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

        # ↓ 以下3行を追加
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # ... 以下certbotが自動追加したSSL設定 ...
}
```

**3. 設定を適用**：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**4. 動作確認**：

```bash
curl -I https://ra.takemitsu.net
# 以下のヘッダーが表示されればOK：
# strict-transport-security: max-age=63072000
# x-frame-options: SAMEORIGIN
# x-content-type-options: nosniff
```

#### セキュリティヘッダーの説明

| ヘッダー | 効果 | 遭遇確率 |
|---------|------|---------|
| **Strict-Transport-Security** | HTTPS強制（2年間） | - |
| **X-Frame-Options: SAMEORIGIN** | クリックジャッキング対策（iframe埋め込み防止） | 低い（個人PJ） |
| **X-Content-Type-Options: nosniff** | MIME sniffing対策（偽装ファイルのXSS防止） | 低い（個人PJ） |

**個人プロジェクトでの位置づけ**：
- 実際に攻撃される確率は極めて低い
- でも「2025年の最低ライン」として設定
- 1行ずつ、コストゼロ、将来的な保険

---

### オプション（未実施）：追加のセキュリティ強化

以下は**個人プロジェクト（5ユーザー、低トラフィック）では効果薄い**と判断し、未実施です。
**必要に応じて実施**してください。

#### 1. レート制限

**目的**: DDoS攻撃、ブルートフォース攻撃の防止

**個人PJでの判断**: 不要（攻撃対象になりにくい）

**設定例**（必要な場合）:

```bash
# レート制限ゾーン定義
sudo nano /etc/nginx/conf.d/ra9-rate-limit.conf
```

```nginx
limit_req_zone $binary_remote_addr zone=ra9_api_limit:10m rate=50r/s;
```

```nginx
# ra.conf の location /api/ に追加
location /api/ {
    limit_req zone=ra9_api_limit burst=20 nodelay;
    proxy_pass http://localhost:3000;
    # ... 他のproxy設定 ...
}
```

#### 2. 静的ファイルキャッシュ

**目的**: パフォーマンス向上（応答速度5-10倍）

**個人PJでの判断**: 不要（トラフィック少ない）

**設定例**（必要な場合）:

```nginx
location /_next/static/ {
    proxy_pass http://localhost:3000;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. タイムアウト設定

**目的**: Slow Loris攻撃、リソース枯渇攻撃の防止

**個人PJでの判断**: 不要（現状で問題なし）

**設定例**（必要な場合）:

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

---

### Content-Security-Policy（CSP）について

**未実施理由**:
- Next.js 16で厳格なnonceベースCSPを実装すると、Static Optimization、ISR、PPRが使えなくなる
- 小規模プロジェクトでは、他のセキュリティ層（Auth.js、Zod、React）で十分保護されている
- 詳細: https://nextjs.org/docs/app/guides/content-security-policy

---

## ログ管理の最適化

### 実施済み：native logrotate設定（2025-11-12）

**実施理由**:
- PM2はデフォルトでログを無制限に蓄積（ディスク容量枯渇の原因）
- pm2-logrotateは非推奨（メンテナンスされていない）
- native logrotateが2025年のベストプラクティス（PM2公式推奨）

**実施内容**:
- 7日分保持、自動圧縮
- 毎日自動実行（cronで管理）
- PM2再起動不要

### 設定手順（実施済み）

**VPS上で実行**:

```bash
# VPSにSSH接続
ssh ubuntu@takemitsu.net

# logrotate設定ファイルを作成
sudo nano /etc/logrotate.d/pm2-ubuntu
```

**設定内容**（`/etc/logrotate.d/pm2-ubuntu`）:

**注意**: logrotateは行末コメントを許可しません。以下のようにコメントなしで記述してください。

```bash
/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    su ubuntu ubuntu
}
```

### 設定の説明

| オプション | 説明 |
|----------|------|
| `daily` | 毎日ローテーション |
| `rotate 7` | 7日分保持（8日目以降は自動削除） |
| `missingok` | ログファイルが存在しなくてもエラーにしない |
| `notifempty` | 空のログファイルはローテーションしない |
| `compress` | 古いログをgzip圧縮（ディスク使用量削減） |
| `delaycompress` | 最新の古いログは圧縮しない（次回圧縮） |
| `copytruncate` | PM2を再起動せずにローテーション実行 |
| `su ubuntu ubuntu` | ubuntuユーザー権限で実行 |

### 設定のテスト（実施済み）

```bash
# logrotate設定のテスト（dry-run）
$ sudo logrotate -d /etc/logrotate.d/pm2-ubuntu
rotating pattern: /home/ubuntu/.pm2/logs/*.log  after 1 days (7 rotations)
✅ 設定成功

# ログファイルの確認
$ ls -lh ~/.pm2/logs/
total 8.0K
-rw-rw-r-- 1 ubuntu ubuntu 783 Nov 11 18:38 ra9-app-error.log
-rw-rw-r-- 1 ubuntu ubuntu 800 Nov 12 12:39 ra9-app-out.log
```

**自動実行**:
- logrotateは `/etc/cron.daily/logrotate` により毎日自動実行されます
- 手動での設定は不要
- 8日目以降のログは自動削除されます

---

## 参考リソース

- [Nginx Security Hardening Guide](https://www.secopsolution.com/blog/nginx-security-hardening-guide)
- [NGINX Security Headers, the right way](https://www.getpagespeed.com/server-setup/nginx-security-headers-the-right-way)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)
- [Linux Logrotate Documentation](https://linux.die.net/man/8/logrotate)

---

**ドキュメント作成日**: 2025-11-11
**最終更新日**: 2025-11-12（ログローテーション・セキュリティヘッダー実施完了）
