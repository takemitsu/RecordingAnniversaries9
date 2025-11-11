# TODO

## データ移行（ra8 → ra9）📦

### 1. ra8側のエクスポートスクリプト作成
- [ ] ra8プロジェクトのClaudeに `docs/deployment/RA8_EXPORT_SPEC.md` を渡す
- [ ] エクスポートスクリプト作成を依頼
- [ ] ra8でエクスポート実行: `php artisan export:data` または `npm run export`
- [ ] `export.json` の出力確認

### 2. ローカル環境でテスト
- [ ] `export.json` を ra9 プロジェクトルートにコピー
- [ ] テストDB準備（ra9_test）
- [ ] テストDBにインポート: `DATABASE_URL="mysql://..." npm run import:data export.json`
- [ ] データ検証:
  - [ ] ユーザー数が正しいか（6人）
  - [ ] Collections数が正しいか
  - [ ] Anniversaries数が正しいか
  - [ ] 各ユーザーのデータが表示されるか（ブラウザ確認）
  - [ ] CRUD操作が正常に動作するか

### 3. 本番環境への移行
- [ ] 本番DB バックアップ取得
- [ ] 本番DBにインポート: `DATABASE_URL="mysql://..." npm run import:data export.json`
- [ ] 本番環境での動作確認
- [ ] 各ユーザーがGoogle OAuthでログイン可能か確認

**参考ドキュメント**:
- [DATA_MIGRATION_JSON.md](../deployment/DATA_MIGRATION_JSON.md) - 全体の移行手順
- [RA8_EXPORT_SPEC.md](../deployment/RA8_EXPORT_SPEC.md) - ra8側のエクスポート仕様

---

## 未実装・今後の拡張 🚧

### セキュリティ強化
- [ ] **Server Actionsレート制限の実装**（優先度: Low）
  - 認証済みアプリではリスク低（悪意のある正規ユーザーのみ）
  - 本番デプロイ前に再検討
  - 実装候補:
    - `upstash/ratelimit` + Redis/Vercel KV（本番推奨）
    - カスタムメモリベース実装（開発環境向け）
  - 推奨レート: 10-20 req/min（フォーム送信）、60 req/min（読み取り）

### 機能拡張
- [ ] **ブラウザプッシュ通知**（検討中）
  - 記念日のリマインダー通知
  - Service Worker + Push API
  - 優先度: 検討段階

### パフォーマンス最適化

#### Next.js 16 / React 19 最適化

**Why（なぜ必要か）**:
- 開発環境でTurbopackは有効だが、ビルド時の最適化が不十分
- 画像が未最適化で、ページロード時間が長い（LCP、CLS指標に悪影響）
- Next.js 16の新機能を活用できていない

**Purpose（何のために）**:
- Turbopackをビルド時にも活用し、デプロイ時間を短縮
- 画像最適化により、Core Web Vitalsを改善し、SEO効果を向上
- 最新のNext.js機能を活用し、パフォーマンスとユーザー体験を向上

**Impact（影響）**:
- ビルド時間の短縮: webpack（5分）→ Turbopack（1-2分）
- ページロード時間の短縮: 画像最適化で30-50%改善
- SEO効果の向上: Core Web Vitals改善でGoogle検索順位に好影響

- [ ] **Turbopackの活用**
  - 開発環境で既に有効（`next dev --turbo`）
  - ビルド時のパフォーマンス最適化
- [ ] **画像最適化**
  - `next/image` の積極活用
  - WebP/AVIF自動変換

#### Node.js 20 機能の活用

**Why（なぜ必要か）**:
- Node.jsのデフォルトメモリ制限が不適切で、メモリリークが発生した場合にOOM（Out of Memory）でクラッシュ
- セキュリティアップデートが手動で、脆弱性が放置されるリスク
- Node.js 20の新機能（パフォーマンス改善、セキュリティ強化）を活用できていない

**Purpose（何のために）**:
- メモリ制限を明示的に設定し、メモリリークの影響を限定
- Dependabotでセキュリティアップデートを自動化し、脆弱性を早期発見
- Node.js 20の新機能を活用し、パフォーマンスとセキュリティを向上

**Impact（影響）**:
- 可用性向上: メモリ制限でOOMクラッシュを防止
- セキュリティリスクの低減: 脆弱性の早期発見と修正
- パフォーマンス向上: Node.js 20の最適化を活用

- [ ] **メモリ制限を設定**
  ```json
  // package.json
  {
    "scripts": {
      "start": "NODE_OPTIONS='--max-old-space-size=512' next start"
    }
  }
  ```
- [ ] **セキュリティアップデート**
  - 定期的な `npm audit` 実行
  - Dependabot 有効化

### データベース最適化

#### Drizzle ORM設定の最適化

**Why（なぜ必要か）**:
- 現在のdrizzle.config.tsでは、マイグレーションテーブル名が明示されておらず、デフォルト名が使用される
- verboseモードが無効で、マイグレーション実行時の詳細ログが出力されない
- strictモードが無効で、スキーマの不整合を検知できない

**Purpose（何のために）**:
- マイグレーションテーブルを明示し、データベース管理を明確化
- verboseモードで詳細ログを出力し、トラブルシューティングを容易に
- strictモードでスキーマの整合性を保証し、バグを早期発見

**Impact（影響）**:
- デバッグ効率の向上: マイグレーション実行時の詳細ログ
- バグの早期発見: strictモードでスキーマ不整合を検知
- データベース管理の透明性: マイグレーションテーブルの明示

- [ ] **マイグレーションテーブルの明示**
  ```typescript
  // drizzle.config.ts
  export default {
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    driver: "mysql2",
    dbCredentials: {
      uri: env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
    migrations: {
      table: "drizzle_migrations",
      schema: "public",
    },
  };
  ```

### 認証セキュリティ強化

#### Auth.js v5 セキュリティ強化

**Why（なぜ必要か）**:
- 現在、セッションタイムアウトが未設定で、セッションが無期限に有効（セキュリティリスク）
- セッションが長期間有効だと、セッション固定攻撃のリスクが高まる

**Purpose（何のために）**:
- セッションタイムアウトを設定し、セッション固定攻撃のリスクを低減
- セキュリティポスチャを向上し、認証システムの堅牢性を確保

**Impact（影響）**:
- セキュリティリスクの低減: セッション固定攻撃の防御
- コンプライアンス向上: セッション管理のベストプラクティス遵守
- ユーザー保護: 盗まれたセッションの有効期間を制限

- [ ] **セッションタイムアウトを設定**
  ```typescript
  // auth.ts
  export const { handlers, signIn, signOut, auth } = NextAuth({
    session: {
      strategy: "database",
      maxAge: 30 * 24 * 60 * 60, // 30日
      updateAge: 24 * 60 * 60,   // 24時間
    },
    // ...
  });
  ```

### 開発体制・ドキュメント

#### テスト戦略の強化

**Why（なぜ必要か）**:
- 現在、テストはローカルでのみ実行され、CI/CDパイプラインに統合されていない
- テストが自動化されていないため、コミット前にテストをスキップするリスク
- バグがデプロイ後に発見され、本番環境で障害が発生する可能性

**Purpose（何のために）**:
- テストをCI/CDパイプラインに統合し、全てのコミットでテストを自動実行
- テストをスキップするリスクを排除し、コードの品質を保証
- バグを早期発見し、本番環境での障害を防止

**Impact（影響）**:
- コード品質の向上: 全てのコミットで自動テスト
- バグの早期発見: デプロイ前にバグを検知
- デプロイの信頼性向上: テスト通過したコードのみデプロイ

- [ ] **Integration TestsをCIに統合**
  - GitHub Actionsでテスト実行
  - MySQL TestDB をサービスコンテナで起動
- [ ] **E2E TestsをCIに統合**
  - Playwright をヘッドレスモードで実行

#### ドキュメントの充実

**Why（なぜ必要か）**:
- 技術選定の理由が記録されておらず、なぜその技術を選んだのかが不明
- 障害対応手順が文書化されておらず、インシデント発生時の対応が属人化
- アーキテクチャ図がなく、新規メンバーがシステム全体を理解するのに時間がかかる

**Purpose（何のために）**:
- ADRで技術選定の理由を記録し、将来のリファクタリング時に判断基準を提供
- Runbookで障害対応手順を文書化し、インシデント対応を標準化
- アーキテクチャ図でシステム全体を可視化し、オンボーディングを容易に

**Impact（影響）**:
- 技術負債の削減: 技術選定の理由が明確で、不要なリファクタリングを回避
- インシデント対応の迅速化: Runbookで標準化された手順で対応
- オンボーディング時間の短縮: アーキテクチャ図で全体像を即座に理解（数日 → 数時間）

- [ ] **ADR（Architecture Decision Records）作成**
  - 技術選定の理由を記録
  - `docs/adr/` ディレクトリ
- [ ] **Runbook作成**
  - 障害対応手順
  - `docs/operations/RUNBOOK.md`
- [ ] **アーキテクチャ図の作成**
  - システム構成図
  - データフロー図

---

## デプロイメント改善（2025年ベストプラクティス）🚀

**出典**: DEPLOYMENT.md 包括的レビュー（2025-11-10実施）

### 🔴 Critical Security Issues (Priority 1)

#### 1. SSH鍵管理の改善

**Why（なぜ必要か）**:
- 現在、個人用のRSA鍵をデプロイに使用しているため、鍵が漏洩した場合に個人のVPSアクセスとデプロイが同時に侵害される
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

- [ ] **デプロイ専用のed25519鍵を生成**
  - 現在: 個人用RSA鍵を使用（セキュリティリスク）
  - 改善: `ssh-keygen -t ed25519 -C "deploy@recording-anniversaries9"`
  - 鍵の権限: `chmod 600`
  - GitHub Secretsに登録: `VPS_SSH_KEY`

#### 2. SSH接続設定の強化

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

- [ ] **タイムアウトとポート設定を追加**
  ```yaml
  - name: Deploy to VPS
    uses: appleboy/ssh-action@master
    with:
      host: ${{ secrets.VPS_HOST }}
      username: ${{ secrets.VPS_USER }}
      key: ${{ secrets.VPS_SSH_KEY }}
      port: 22
      timeout: 60s
      command_timeout: 30m
  ```

---

### 🟡 Important Issues (Priority 2)

#### 3. Nginx設定の強化

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

- [ ] **セキュリティヘッダーを追加**
  ```nginx
  # HSTS (HTTP Strict Transport Security)
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

  # Clickjacking protection
  add_header X-Frame-Options "SAMEORIGIN" always;

  # MIME type sniffing protection
  add_header X-Content-Type-Options "nosniff" always;

  # Referrer policy
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Content Security Policy (adjust for Next.js)
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

  # Permissions Policy
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  ```
- [ ] **レート制限を設定**
  ```nginx
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
  limit_req zone=api_limit burst=20 nodelay;
  ```
- [ ] **タイムアウトを設定**
  ```nginx
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
  ```
- [ ] **静的ファイルのキャッシュ**
  ```nginx
  location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  ```

#### 4. ログ管理の改善

**Why（なぜ必要か）**:
- 現在のログは無制限に蓄積され、ディスク容量を圧迫する（PM2デフォルト: `~/.pm2/logs/`、ローテーションなし）
- pm2-logrotateはメンテナンスされておらず、バグが多い（PM2公式も非推奨）
- ログがプレーンテキストで、検索・解析が困難（grep/awkに依存）

**Purpose（何のために）**:
- native logrotateを使用し、ディスク容量を適切に管理（2025年のベストプラクティス）
- PM2公式推奨の方法でログローテーションを実現
- 構造化ログ（JSON）を採用し、ログ解析ツールとの連携を容易に（将来的な拡張）

**Impact（影響）**:
- 運用コスト削減: ディスク容量の適切な管理（7日で自動削除）
- 安定性向上: メンテナンスされているnative logrotateを使用
- トラブルシューティング効率の向上: ログの一元管理

- [ ] **native logrotate設定（PM2公式推奨）**
  - `/etc/logrotate.d/pm2-<user>` に設定ファイルを作成
  ```bash
  # /etc/logrotate.d/pm2-ubuntu
  /home/ubuntu/.pm2/logs/*.log {
      daily
      rotate 7
      missingok
      notifempty
      compress
      delaycompress
      copytruncate
  }
  ```
- [ ] **構造化ログ（JSON）を採用（オプション）**
  - pino などのロガー導入（将来的な拡張）
  - ログ解析ツール（Loki, Grafana）との連携を視野に

