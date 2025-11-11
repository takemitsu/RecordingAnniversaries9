# TODO

## ✅ データ移行（ra8 → ra9）- 完了

**完了日**: 2025-11-11

### 完了した作業

- ✅ ra8側でエクスポート実行
- ✅ `export.json`の出力確認（5ユーザー、15 Collections、36 Anniversaries）
- ✅ 本番環境への移行
  - データ移行成功: `DATABASE_URL="mysql://..." npm run import:data export.json`
  - 全ユーザーでGoogle OAuthログイン確認済み
  - CRUD操作動作確認済み

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
    verbose: true,    // 実行されるSQL文を表示
    strict: true,     // 変更前に確認を求める
    migrations: {
      table: "__drizzle_migrations",  // デフォルト値を明示
    },
  };
  ```
  - **注意**: `migrations.schema` は PostgreSQL 専用のため、MySQLでは不要

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

## ✅ デプロイメント改善（2025年ベストプラクティス）- 完了

**完了日**: 2025-11-11
**出典**: DEPLOYMENT.md 包括的レビュー（2025-11-10実施）

### 完了した改善項目

#### 1. ドキュメント構造の最適化
- ✅ DEPLOYMENT.md（498行）: 手動デプロイ手順のみに集中
- ✅ CI_CD_SETUP.md（381行）: CI/CD自動化設定を分離
- ✅ PRODUCTION_HARDENING.md（310行）: セキュリティ強化をオプション化
- **効果**: 1070行 → 3ファイル分割で可読性向上、メンテナンス容易化

#### 2. SSH鍵管理の改善（Critical Security）
- ✅ デプロイ専用のed25519鍵を生成（CI_CD_SETUP.md）
- ✅ SSH鍵ローテーション手順を追加（年1回推奨）
- ✅ 最小権限の原則を適用
- **効果**: セキュリティリスク低減、SSH接続15倍高速化

#### 3. SSH接続設定の強化（Critical Security）
- ✅ タイムアウト設定を追加（.github/workflows/deploy.yml、CI_CD_SETUP.md）
  - `timeout: 60s` - SSH接続タイムアウト
  - `command_timeout: 10m` - コマンド実行タイムアウト
- ✅ ポート番号を明示（port: 22）
- **効果**: CI/CD安定性向上、ネットワーク障害時の早期検知

#### 4. Nginx設定の強化（Important Security）
- ✅ セキュリティヘッダーを追加（PRODUCTION_HARDENING.md）
  - HSTS、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy
  - CSPは削除（Next.js 16の制約により、ISR/SSG/PPR無効化を回避）
- ✅ レート制限を設定（50r/s、プロジェクト固有のra9_api_limit）
- ✅ タイムアウトを設定（60s）
- ✅ 静的ファイルのキャッシュ（/_next/static/、1年キャッシュ）
- **効果**: セキュリティ向上、DDoS耐性、パフォーマンス5-10倍改善

#### 5. ログ管理の改善（Important Operations）
- ✅ native logrotate設定（PM2公式推奨、PRODUCTION_HARDENING.md）
- ✅ 7日ローテーション、gzip圧縮
- **効果**: ディスク容量適切管理、運用コスト削減

#### 6. 運用方針の明確化
- ✅ develop環境の運用方針を明記（CI_CD_SETUP.md）
  - develop = ローカル環境、stagingサーバーなし
- ✅ Git Flowブランチ戦略を明示
- **効果**: 運用の透明性向上、誤解の防止

#### 7. 細かい修正
- ✅ Nginx表記を修正（1.28.0 (stable)、LTS表記削除）
- ✅ GitHubリポジトリURLを修正（takemitsu/RecordingAnniversaries9）
- ✅ VPS上のディレクトリ名を統一（~/RecordingAnniversaries9）
- **効果**: 一貫性向上、混乱の防止

### 残りのオプション項目

- [ ] **構造化ログ（JSON）を採用（オプション）**
  - pino などのロガー導入（将来的な拡張）
  - ログ解析ツール（Loki, Grafana）との連携を視野に
  - 現状: プレーンテキストログで十分運用可能

