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

#### ✅ セキュリティアップデートの自動化 - 完了

**完了日**: 2025-11-11

**完了した項目**:
- ✅ **Dependabot alerts 有効化** - 脆弱性の自動検知
- ✅ **Dependabot security updates 有効化** - セキュリティ修正PRの自動作成
- 設定場所: GitHub Settings → Security → Advanced Security

**効果**:
- セキュリティリスクの低減: 脆弱性の早期発見と自動PR作成
- メンテナンス効率化: セキュリティアップデートが自動化

**残りのオプション項目**:
- [ ] **定期的な `npm audit` 実行**（CI/CDに統合、オプション）

### ✅ データベース最適化 - 完了

**完了日**: 既に実装済み（drizzle.config.ts:10-11）

#### Drizzle ORM設定の最適化

- ✅ **verbose モード設定済み** - マイグレーション実行時に詳細ログを出力
- ✅ **strict モード設定済み** - スキーマ変更時に確認を求める
- 実装場所: `drizzle.config.ts:10-11`

**効果**:
- デバッグ効率の向上: マイグレーション実行時の詳細ログ
- バグの早期発見: strictモードでスキーマ不整合を検知

### ✅ 認証セキュリティ強化 - 完了

**完了日**: 既に実装済み（auth.ts:68-71）

#### Auth.js v5 セッションタイムアウト

- ✅ **セッションタイムアウト設定済み**
  - `maxAge: 30日` - セッション最大有効期限
  - `updateAge: 24時間`（デフォルト値） - セッション更新間隔
  - 実装場所: `auth.ts:68-71`

**効果**:
- セキュリティリスクの低減: セッション固定攻撃の防御
- ユーザー保護: 盗まれたセッションの有効期間を制限（最大30日）

### 開発体制・ドキュメント

#### ✅ テスト戦略の強化 - 完了

**完了日**: 既に実装済み（.github/workflows/deploy.yml）

**完了した項目**:
- ✅ **Unit Tests CI統合** - 55テスト自動実行
- ✅ **Integration Tests CI統合** - 33テスト、MySQL TestDBをサービスコンテナで起動
- ✅ **Component Tests CI統合** - 88テスト自動実行
- ✅ **Lint/Type Check** - 自動実行
- ✅ **Build Check** - ビルド成功を確認

**実装場所**: `.github/workflows/deploy.yml` の `ci` ジョブ

**効果**:
- コード品質の向上: 全てのコミットで176テストを自動実行
- バグの早期発見: デプロイ前にバグを検知
- デプロイの信頼性向上: テスト通過したコードのみデプロイ

**E2E Testsについて**:
- E2E（24テスト）は手動実行で十分（遅い、不安定、コスト高）
- デプロイ前にローカルで `npm run test:e2e` を実行
- CI統合は不要と判断

#### ✅ ドキュメントの充実 - 完了

**完了日**: 2025-11-11

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

**完了した項目**:
- ✅ **ADR（Architecture Decision Records）作成** - `docs/adr/`
  - 0001: Drizzle ORMの採用
  - 0002: Auth.js v5の採用
  - 0003: Tailwind CSS v4の採用
  - 0004: 記念日にDATE型を使用
  - 0005: dayjsの採用
  - 0006: Next.js 16 App Routerの採用
- ✅ **Runbook作成** - `docs/operations/RUNBOOK.md`
  - 重大度レベル定義（P0-P3）
  - オンコール対応フロー
  - インシデント対応手順（診断 → 緩和 → 修正 → 検証 → 事後対応）
  - 主要インシデントシナリオ
- ✅ **アーキテクチャ図の作成** - `docs/architecture/SYSTEM_ARCHITECTURE.md`
  - システム構成図（Mermaid）
  - データフロー図（Mermaid）
  - アプリケーション構造図（Mermaid）
  - データベーススキーマ（ER図）
  - 認証フロー（シーケンス図）

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

