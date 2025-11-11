# 運用・メンテナンス

日常的な運用とメンテナンス手順をまとめています。

## アプリケーション更新

### CI/CD（GitHub Actions）の場合

1. 開発ブランチで変更を実装
2. `develop` ブランチへPR作成→マージ（自動テスト）
3. 動作確認後、`develop` から `main` へPR作成→マージ（自動テスト + 自動デプロイ）

### 手動デプロイの場合

```bash
# VPSにSSH接続
cd ~/recording-anniversaries9

# Gitから最新版を取得
git pull origin main

# 依存関係を更新（必要に応じて）
# VPS上でビルドする場合は devDependencies も必要
npm ci

# ビルド
npm run build

# PM2でアプリケーションを再起動
pm2 restart ra9-app

# ログ確認
pm2 logs ra9-app --lines 50
```

---

## データベースマイグレーション（スキーマ変更時）

```bash
cd ~/recording-anniversaries9

# マイグレーション実行
npm run db:migrate

# アプリケーション再起動
pm2 restart ra9-app
```

---

## ログ確認

### PM2ログ

```bash
# リアルタイムログ
pm2 logs ra9-app

# 過去100行
pm2 logs ra9-app --lines 100
```

### Nginxログ

```bash
# アクセスログ
sudo tail -f /var/log/nginx/access.log

# エラーログ
sudo tail -f /var/log/nginx/error.log
```

### MySQLログ

```bash
sudo tail -f /var/log/mysql/error.log
```

---

## バックアップ

### データベースバックアップ

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

### ファイルバックアップ

```bash
# アプリケーションディレクトリのバックアップ（.env.localを含む）
tar -czf ~/backups/ra9_app_$(date +%Y%m%d).tar.gz ~/recording-anniversaries9 --exclude=node_modules --exclude=.next
```

---

## PM2プロセス管理

### 基本操作

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
```

### 監視

```bash
# メモリ使用量監視（リアルタイム）
pm2 monit
```

---

## 関連ドキュメント

- [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - デプロイ手順
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング
- [SECURITY_CHECKLIST.md](../deployment/SECURITY_CHECKLIST.md) - セキュリティチェック
