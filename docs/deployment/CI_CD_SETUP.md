# CI/CD自動デプロイ設定

このドキュメントは、GitHub Actionsを使った自動デプロイの設定手順です。

**前提条件**:
- [DEPLOYMENT.md](./DEPLOYMENT.md) で手動デプロイが完了していること
- GitHubリポジトリがあること

**注意**: CI/CD設定は必須ではありません。手動デプロイでも十分に運用可能です。

---

## 目次

1. [概要](#概要)
2. [SSH鍵のセキュリティ強化](#ssh鍵のセキュリティ強化)
3. [GitHub Secrets設定](#github-secrets設定)
4. [GitHub Actionsワークフローファイル](#github-actionsワークフローファイル)
5. [手動デプロイ実行方法](#手動デプロイ実行方法)
6. [ロールバック手順](#ロールバック手順)
7. [デプロイ通知（オプション）](#デプロイ通知オプション)

---

## 概要

以下のワークフローを実装します（Git Flow）：

1. **自動テスト**: develop/main へのPR作成時・push時、Lint/TypeCheck/Test を自動実行（.github/workflows/ci.yml）
2. **自動デプロイ**: main ブランチへのpush時、本番環境へ自動デプロイ（.github/workflows/deploy.yml）
3. **手動デプロイ**: GitHub UI から手動でデプロイトリガー

### ブランチ戦略と環境

**Git Flow**:
- 開発ブランチ → PR → develop（CI） → PR → main（CI + 自動デプロイ）

**環境構成**:
- `develop`: 開発者のローカル環境で動作確認
- `main`: 本番環境（ra.takemitsu.net）へ自動デプロイ

**注意**: stagingサーバーは使用しません。developブランチでの動作確認は開発者のローカル環境で実施してください。

### CI/CD フロー図

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

## SSH鍵のセキュリティ強化

**Why（なぜ必要か）**:
- 個人用のSSH鍵をデプロイに使用すると、鍵が漏洩した場合に個人のVPSアクセスとデプロイが同時に侵害される
- RSA-2048はed25519と比較して、鍵長が長く、暗号学的に古いアルゴリズム
- 単一障害点（SPOF）となっており、鍵のローテーションが困難

**Purpose（何のために）**:
- デプロイ専用の鍵を分離し、最小権限の原則（Principle of Least Privilege）を適用
- より安全で高速なed25519アルゴリズムに移行（RSA-2048の約15倍高速）
- 鍵が侵害された場合の影響範囲をデプロイのみに限定

**Impact（影響）**:
- セキュリティリスクの低減: 個人アカウントとデプロイの分離
- パフォーマンス向上: SSH接続の高速化
- 運用改善: 鍵のローテーションが容易（デプロイ鍵のみ交換可能）

### デプロイ専用のed25519鍵を生成

**ローカルマシンで実行**:

```bash
# デプロイ専用のed25519鍵を生成
ssh-keygen -t ed25519 -C "deploy@ra9" -f ~/.ssh/id_ed25519_ra9_deploy

# パスフレーズは空でOK（GitHub Secretsで保護される）

# 公開鍵をVPSに登録
ssh-copy-id -i ~/.ssh/id_ed25519_ra9_deploy.pub ubuntu@takemitsu.net

# または手動でコピー
cat ~/.ssh/id_ed25519_ra9_deploy.pub
# ↑ この内容を VPS の ~/.ssh/authorized_keys に追加
```

**VPS側で権限設定**:

```bash
# VPSにSSH接続
ssh ubuntu@takemitsu.net

# パーミッション確認・修正
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**接続テスト**:

```bash
# ローカルマシンで接続確認
ssh -i ~/.ssh/id_ed25519_ra9_deploy ubuntu@takemitsu.net

# 接続できればOK
```

**GitHub Secretsに登録**:

```bash
# 秘密鍵の内容をコピー
cat ~/.ssh/id_ed25519_ra9_deploy

# ↑ この内容を GitHub Secrets の VPS_SSH_KEY に登録
```

### SSH接続設定の強化

**Why（なぜ必要か）**:
- 現在のdeploy.ymlにはタイムアウト設定がなく、ネットワーク障害時にジョブがハングする可能性
- ポート番号が明示されていないため、デフォルトポート（22）以外を使用している場合に接続失敗
- 長時間実行されるデプロイコマンド（ビルド、マイグレーション）でタイムアウトが発生する可能性

**Purpose（何のために）**:
- ネットワーク障害時の早期検知と自動フェイルオーバー
- 長時間実行コマンドに対する適切なタイムアウト設定
- デプロイの信頼性向上

**Impact（影響）**:
- CI/CDの安定性向上: ハングせずに失敗を検知
- デバッグ効率の向上: タイムアウトログで問題箇所を特定
- 運用コスト削減: GitHub Actionsの実行時間を無駄にしない

**.github/workflows/deploy.yml に追加**:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    port: 22                    # ポート番号を明示
    timeout: 60s                # SSH接続タイムアウト（60秒）
    command_timeout: 10m        # コマンド実行タイムアウト（10分）
    script: |
      cd ~/RecordingAnniversaries9
      git pull origin main
      # ... 以下既存のコマンド
```

**推奨設定値**:
- `timeout: 60s` - SSH接続タイムアウト（ネットワーク障害時）
- `command_timeout: 10m` - コマンド実行タイムアウト（ビルド・マイグレーション、通常5-10分で完了）

---

## GitHub Secrets設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下を追加：

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `VPS_HOST` | VPSのホスト名 | `takemitsu.net` |
| `VPS_USER` | SSHユーザー名 | `ubuntu` |
| `VPS_SSH_KEY` | SSH秘密鍵 | （秘密鍵の内容全体） |
| `DATABASE_URL` | 本番DB接続文字列 | `mysql://ra9user:password@localhost:3306/ra9` |
| `AUTH_SECRET` | Auth.js署名鍵 | `openssl rand -base64 32`で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ra8から取得 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ra8から取得 |

### GitHub Secretsへの設定方法

機密情報のみをGitHub Secretsに設定します。非機密情報（URLs、APP_NAME等）は`deploy.yml`に直接記述されているため、変更時はGit経由で更新できます。

**設定手順**:

1. GitHubリポジトリページで「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」をクリック
3. 各Secretを個別に追加

**重要**: 機密情報のみSecretsに設定することで、運用性が向上します（非機密情報の変更時にSecretsを触る必要がない）

---

## GitHub Actionsワークフローファイル

ワークフローファイルは既にリポジトリに含まれています：

- **`.github/workflows/ci.yml`**: 自動テスト（develop/main へのPR・push時）
- **`.github/workflows/deploy.yml`**: 自動デプロイ（main へのpush時）

**ファイルの内容は直接参照してください**：
- [ci.yml](../../.github/workflows/ci.yml)
- [deploy.yml](../../.github/workflows/deploy.yml)

**主要な設定**:
- ci.yml: `branches: [ develop, main ]`
- deploy.yml: `branches: [ main ]`、Secrets検証あり

### E2Eテスト除外（CI環境）

E2EテストはCI環境では実行しない（ブラウザが必要なため）。必要に応じて `.github/workflows/ci.yml` に以下を追加：

```yaml
      - name: Run E2E Tests (optional)
        if: false  # CI環境ではスキップ
        run: npm run test:e2e
```

---

## 手動デプロイ実行方法

### GitHub Actions経由（推奨）

1. GitHubリポジトリページで「Actions」タブをクリック
2. 左サイドバーから「Deploy to Production」を選択
3. 「Run workflow」ボタンをクリック
4. ブランチ（main）を選択して実行

### VPS上で直接実行（緊急時）

GitHub Actionsが使えない場合やテスト目的で、VPS上で直接デプロイ可能：

```bash
# VPSにSSH接続
ssh ubuntu@takemitsu.net

# プロジェクトディレクトリに移動
cd ~/RecordingAnniversaries9

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

---

## ロールバック手順

デプロイ後に問題が発生した場合のロールバック：

```bash
# VPSにSSH接続
cd ~/RecordingAnniversaries9

# 前のコミットに戻す
git log --oneline -5  # コミット履歴確認
git reset --hard <前のコミットハッシュ>

# 再ビルド・再起動
npm run build
pm2 restart ra9-app
```

---

## デプロイ通知（オプション）

Slack通知を追加する場合、`.github/workflows/deploy.yml` に追加：

```yaml
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to ra.takemitsu.net'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Slack Webhook URLを GitHub Secrets に追加してください。

---

## 参考リソース

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Key Best Practices for 2025](https://www.brandonchecketts.com/archives/ssh-ed25519-key-best-practices-for-2025)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)

---

## SSH鍵のローテーション（年1回推奨）

セキュリティベストプラクティスとして、デプロイ用SSH鍵は年1回程度ローテーションすることを推奨します。

### ローテーション手順

1. **新しいed25519鍵を生成**
   ```bash
   ssh-keygen -t ed25519 -C "deploy@ra9-$(date +%Y)" -f ~/.ssh/id_ed25519_ra9_deploy_new
   ```

2. **VPSに新しい公開鍵を追加**（古い鍵は残す）
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519_ra9_deploy_new.pub ubuntu@takemitsu.net
   ```

3. **GitHub Secretsを更新**
   - GitHubリポジトリ → Settings → Secrets and variables → Actions
   - `VPS_SSH_KEY`を新しい秘密鍵に更新
   ```bash
   # 新しい秘密鍵の内容をコピー
   cat ~/.ssh/id_ed25519_ra9_deploy_new
   ```

4. **テストデプロイで動作確認**
   - GitHub Actionsで手動デプロイを実行
   - 成功を確認

5. **古い公開鍵をVPSから削除**
   ```bash
   # VPSにログイン
   ssh ubuntu@takemitsu.net

   # authorized_keysから古い鍵を削除
   nano ~/.ssh/authorized_keys
   # 古い公開鍵の行を削除して保存
   ```

**注意**: 古い鍵を削除する前に、必ず新しい鍵で接続できることを確認してください。

---

**ドキュメント作成日**: 2025-11-11
