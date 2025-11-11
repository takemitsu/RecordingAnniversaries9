# Runbook - 障害対応手順書

Recording Anniversaries 9の本番環境で発生するインシデントへの対応手順を定義します。

## 目次

1. [重大度レベル](#重大度レベル)
2. [オンコール対応フロー](#オンコール対応フロー)
3. [インシデント対応手順](#インシデント対応手順)
4. [主要インシデントシナリオ](#主要インシデントシナリオ)
5. [連絡先とエスカレーション](#連絡先とエスカレーション)

---

## 重大度レベル

| レベル | 定義 | 対応時間 | 例 |
|-------|------|---------|---|
| **P0 (Critical)** | サービス完全停止 | 即時（15分以内） | アプリ全体がダウン、データベース接続不可 |
| **P1 (High)** | 主要機能が使用不可 | 1時間以内 | ログイン不可、CRUD操作失敗 |
| **P2 (Medium)** | 一部機能に影響 | 4時間以内 | Passkey認証のみ失敗、表示の乱れ |
| **P3 (Low)** | 軽微な問題 | 1営業日以内 | UI表示の不具合、パフォーマンス低下 |

---

## オンコール対応フロー

```
インシデント検知
    ↓
[1] 初期評価（5分）
    ├─ 重大度判定（P0-P3）
    ├─ 影響範囲確認
    └─ ステークホルダー通知
    ↓
[2] 診断（15分）
    ├─ ログ確認
    ├─ メトリクス確認
    └─ 根本原因特定
    ↓
[3] 緩和措置（即時）
    ├─ ロールバック
    ├─ 機能無効化
    └─ トラフィック制限
    ↓
[4] 修正実装（状況次第）
    ├─ パッチ適用
    ├─ 設定変更
    └─ インフラ調整
    ↓
[5] 検証（15分）
    ├─ 機能テスト
    ├─ パフォーマンステスト
    └─ モニタリング
    ↓
[6] 事後対応（24時間以内）
    ├─ ポストモーテム作成
    ├─ 再発防止策
    └─ ドキュメント更新
```

---

## インシデント対応手順

### 1. 初期評価（5分以内）

#### チェックリスト
- [ ] インシデント発生時刻を記録
- [ ] 影響を受けているユーザー数を推定
- [ ] 重大度レベルを判定（P0-P3）
- [ ] ステークホルダーに通知（P0/P1の場合）

#### 確認コマンド
```bash
# サービス状態確認
curl https://ra.takemitsu.net
pm2 list

# システムリソース確認
top
df -h
free -h

# 直近のログ確認
pm2 logs ra9-app --lines 50
sudo tail -100 /var/log/nginx/error.log
```

### 2. 診断（15分以内）

#### ログ確認
```bash
# アプリケーションログ
pm2 logs ra9-app --lines 200

# Nginxログ
sudo tail -200 /var/log/nginx/access.log
sudo tail -200 /var/log/nginx/error.log

# MySQLログ
sudo tail -200 /var/log/mysql/error.log

# システムログ
sudo journalctl -u pm2-ubuntu -n 100
sudo journalctl -u nginx -n 100
```

#### メトリクス確認
```bash
# CPU/メモリ使用率
pm2 monit

# ディスク使用率
df -h

# ネットワーク接続
ss -tuln | grep :3000
ss -tuln | grep :3306
```

#### よくある根本原因
- PM2プロセスがダウン
- データベース接続エラー
- メモリ不足（OOM Killer）
- ディスク容量不足
- 環境変数の設定ミス
- Nginx設定エラー

### 3. 緩和措置（即時）

#### シナリオ別対応

##### シナリオA: アプリケーションクラッシュ（P0）
```bash
# PM2で再起動
pm2 restart ra9-app

# 起動確認
pm2 logs ra9-app --lines 20
curl http://localhost:3000
```

##### シナリオB: デプロイ後の問題（P0/P1）
```bash
# 直前のコミットにロールバック
cd ~/RecordingAnniversaries9
git log --oneline -5
git reset --hard <前のコミットハッシュ>

# 再ビルド・再起動
npm run build
pm2 restart ra9-app
```

##### シナリオC: データベース接続エラー（P0）
```bash
# MySQL再起動
sudo systemctl restart mysql

# アプリ再起動
pm2 restart ra9-app
```

##### シナリオD: メモリ不足（P1）
```bash
# メモリ使用量確認
free -h
pm2 show ra9-app

# PM2再起動（メモリリーク対策）
pm2 restart ra9-app
```

### 4. 修正実装

#### パッチ適用の手順
```bash
# 1. 修正ブランチをチェックアウト
cd ~/RecordingAnniversaries9
git fetch origin
git checkout <fix-branch>

# 2. ビルド
npm ci
npm run build

# 3. データベースマイグレーション（必要な場合）
npm run db:migrate

# 4. アプリ再起動
pm2 restart ra9-app

# 5. 動作確認
curl https://ra.takemitsu.net
pm2 logs ra9-app --lines 20
```

### 5. 検証（15分以内）

#### 機能テスト
- [ ] トップページが表示される
- [ ] Google OAuthログインが成功する
- [ ] ダッシュボードが正常に表示される
- [ ] CRUD操作が動作する
- [ ] Passkey認証が動作する

#### パフォーマンステスト
```bash
# レスポンスタイム確認
curl -w "@curl-format.txt" -o /dev/null -s https://ra.takemitsu.net

# 負荷テスト（必要に応じて）
ab -n 100 -c 10 https://ra.takemitsu.net/
```

#### モニタリング
```bash
# リアルタイムログ監視（5分間）
pm2 logs ra9-app

# エラーログ確認
sudo tail -f /var/log/nginx/error.log
```

### 6. 事後対応（24時間以内）

#### ポストモーテム作成

以下の項目を記録：
1. **インシデント概要**: 発生時刻、検知方法、影響範囲
2. **タイムライン**: 各対応ステップの時刻
3. **根本原因**: 技術的な原因
4. **対応内容**: 緩和措置、修正内容
5. **再発防止策**: 今後の改善計画
6. **学んだこと**: チーム全体で共有すべき知見

#### ドキュメント更新
- [ ] TROUBLESHOOTING.mdに新しいケースを追加
- [ ] Runbookに対応手順を追記
- [ ] モニタリングアラートを追加

---

## 主要インシデントシナリオ

### P0: サービス完全停止

#### 原因1: PM2プロセスダウン
```bash
# 診断
pm2 list
pm2 logs ra9-app --lines 50

# 対応
pm2 restart ra9-app

# 検証
curl http://localhost:3000
```

#### 原因2: MySQL停止
```bash
# 診断
sudo systemctl status mysql
mysql -u ra9user -p -e "SELECT 1"

# 対応
sudo systemctl restart mysql
pm2 restart ra9-app

# 検証
mysql -u ra9user -p ra9 -e "SELECT COUNT(*) FROM users"
```

#### 原因3: Nginx停止
```bash
# 診断
sudo systemctl status nginx
sudo nginx -t

# 対応
sudo systemctl restart nginx

# 検証
curl https://ra.takemitsu.net
```

### P1: ログイン不可

#### 原因1: OAuth設定エラー
```bash
# 診断
cat ~/RecordingAnniversaries9/.env.local | grep GOOGLE
pm2 logs ra9-app | grep -i oauth

# 対応
# 環境変数を確認・修正
nano ~/RecordingAnniversaries9/.env.local
pm2 restart ra9-app

# 検証
# ブラウザでGoogle OAuthログインをテスト
```

#### 原因2: セッションテーブルエラー
```bash
# 診断
mysql -u ra9user -p ra9 -e "SELECT COUNT(*) FROM sessions"

# 対応
# 古いセッションをクリーンアップ
mysql -u ra9user -p ra9 -e "DELETE FROM sessions WHERE expires < NOW()"

# 検証
# ログインをテスト
```

### P2: Passkey認証失敗

#### 原因: WebAuthn設定エラー
```bash
# 診断
cat ~/RecordingAnniversaries9/.env.local | grep WEBAUTHN

# 対応
# NEXT_PUBLIC_WEBAUTHN_ORIGIN がhttpsであることを確認
nano ~/RecordingAnniversaries9/.env.local
pm2 restart ra9-app

# 検証
# Passkey登録/認証をテスト
```

---

## 連絡先とエスカレーション

### 連絡先

| 役割 | 担当者 | 連絡方法 |
|-----|-------|---------|
| 開発責任者 | takemitsu | - |
| インフラ管理者 | takemitsu | - |

### エスカレーションパス

1. **P0/P1インシデント**: 即座に開発責任者に通知
2. **P2インシデント**: 1時間以内に通知
3. **P3インシデント**: 日次レポートで報告

### 外部サービス連絡先

| サービス | サポート |
|---------|---------|
| さくらVPS | https://www.sakura.ad.jp/support/ |
| Google Cloud（OAuth） | https://cloud.google.com/support |

---

## 参考ドキュメント

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 詳細なトラブルシューティング
- [OPERATIONS.md](./OPERATIONS.md) - 日常的な運用手順
- [DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - デプロイ手順

---

**最終更新**: 2025-11-11
