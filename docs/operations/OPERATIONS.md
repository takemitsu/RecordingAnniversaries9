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

### 推奨設定（本番環境）

本番環境では以下のオプションを付けてPM2を起動する：

```bash
pm2 delete ra9-app  # 既存プロセスがあれば削除
pm2 start npm --name ra9-app \
  --cron-restart="0 4 * * *" \
  --max-memory-restart 512M \
  -- start
pm2 save
```

| オプション | 説明 |
|-----------|------|
| `--cron-restart="0 4 * * *"` | 毎日午前4時に自動再起動（フリーズ対策） |
| `--max-memory-restart 512M` | メモリ512MB超過で自動再起動 |

**注意**: PM2はプロセスがフリーズした状態（応答しないがプロセスは生存）を検知できない。定期再起動で予防する。

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

## 月次メンテナンス（OS / Node.js / PM2 / 依存パッケージ）

自動更新は使わない（意図しないタイミングで落ちるのを避けるため）。月に 1 回、以下を手動で回す。
2026-10-22 時点の実績: 3 月以降 apt upgrade が止まっていてカーネルが 57 パッチ遅れ、Node 20 が EOL のまま稼働していた。

### 1. OS パッケージ更新

```bash
sudo apt update
apt list --upgradable          # 何が上がるか先に見る
sudo apt upgrade
```

- 末尾に `Pending kernel upgrade!` が出たら `sudo reboot`。再起動後に `uname -r`、`pm2 ls`、`curl -sI https://ra.takemitsu.net | head -1` で確認する
- needrestart が `mysql.service` を再起動することがある。アプリは自動再接続するが、200 が返ることを確認する
- `nodejs` が更新された場合（NodeSource のパッチ版）は `pm2 restart ra9-app` で新バイナリに載せ替える

### 2. Node.js メジャーバージョン切り替え（EOL が近づいたら）

Node.js は NodeSource の apt リポジトリ（`/etc/apt/sources.list.d/nodesource.list`）で管理している。
各ラインの EOL は https://nodejs.org/en/about/previous-releases で確認する。

```bash
# 現状確認
apt policy nodejs | head -3
cat /etc/apt/sources.list.d/nodesource.list

# リポジトリを差し替えて入れ直す（例: 24.x → 26.x）
curl -fsSL https://deb.nodesource.com/setup_26.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs
node -v
```

切り替え後は **必ず PM2 を入れ直し、systemd ユニットを再登録する**（グローバル npm パッケージと起動ユニットは Node のパスに依存する）。

```bash
pm2 save                              # 先に現在のプロセスリストを保存
sudo npm install -g pm2@latest
pm2 update                            # 新しい Node でデーモンを再起動
pm2 ls                                # ← ここで空になっていたら pm2 resurrect
pm2 unstartup systemd                 # 表示された sudo コマンドを実行
pm2 startup systemd                   # 表示された sudo コマンドを実行
pm2 save
curl -sI https://ra.takemitsu.net | head -1
```

**注意**: 2026-10-22 の PM2 6 → 7 更新時、`pm2 update` 後に新デーモンがプロセスを引き継がず約 1 分半 502 になった。`pm2 resurrect` で `~/.pm2/dump.pm2` から復旧できる。`pm2 save` は管理プロセスが空のときは上書きしないので dump は残る。

アプリ側は N-API ベースのため Node メジャー変更後もそのまま起動するが、念のため次のデプロイ（`npm ci` → build）を早めに走らせる。
`.github/workflows/deploy.yml` の `node-version` も本番と揃える。

### 3. 依存パッケージの脆弱性確認

Dependabot は使っていない（通知メールを避けるため）。ローカルで実行する。

```bash
npm audit
npm audit fix              # --force は使わない（breaking change が入る）
```

`--force` が必要と出たものは個別に判断する。2026-10-22 時点の据え置き: `@simplewebauthn/server`（next-auth の peer が ^9）、`csv-parse`（祝日更新スクリプトのみ）、`drizzle-kit` 内の `esbuild`（dev 専用）。

---

## 関連ドキュメント

- [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - デプロイ手順
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティング
- [SECURITY_CHECKLIST.md](../deployment/SECURITY_CHECKLIST.md) - セキュリティチェック
