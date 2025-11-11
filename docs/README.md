# ドキュメント目次

Recording Anniversaries 9 のドキュメント一覧です。

## はじめに

プロジェクト概要については、ルートの [README.md](../README.md) を参照してください。

Claude Code 使用時は、ルートの [CLAUDE.md](../CLAUDE.md) を参照してください。

---

## セットアップ

### [setup/SETUP.md](./setup/SETUP.md)
開発環境のセットアップ手順（データベース、環境変数、依存関係インストール）

---

## テスト

### [TESTING.md](./TESTING.md)
テスト実行・メンテナンス方法（Unit/Integration/Component/E2E、200テスト）

---

## デプロイ

### [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md)
本番環境へのデプロイ手順（さくらVPS、PM2、Nginx、SSL、CI/CD）

### [deployment/DATA_MIGRATION.md](./deployment/DATA_MIGRATION.md)
ra8 → ra9 データ移行手順（スキーマ差分、SQL移行スクリプト）

### [deployment/SECURITY_CHECKLIST.md](./deployment/SECURITY_CHECKLIST.md)
本番環境デプロイ前のセキュリティチェックリスト

---

## 運用

### [operations/OPERATIONS.md](./operations/OPERATIONS.md)
日常的な運用・メンテナンス手順（アプリ更新、ログ確認、バックアップ、PM2管理）

### [operations/RUNBOOK.md](./operations/RUNBOOK.md)
インシデント対応手順書（重大度レベル、オンコール対応フロー、障害対応シナリオ）

### [operations/TROUBLESHOOTING.md](./operations/TROUBLESHOOTING.md)
トラブルシューティングガイド（起動失敗、DB接続エラー、認証問題、SSL証明書など）

---

## リファレンス

### [reference/TECH_DECISIONS.md](./reference/TECH_DECISIONS.md)
技術的決定事項（Next.js 16、Auth.js v5、Drizzle ORM、Passkey など）

### [reference/TODO.md](./reference/TODO.md)
未実装機能・今後の拡張予定

---

## アーキテクチャ

### [architecture/SYSTEM_ARCHITECTURE.md](./architecture/SYSTEM_ARCHITECTURE.md)
システムアーキテクチャの全体像（システム構成図、データフロー図、認証フロー、データベーススキーマ）

### [adr/](./adr/)
Architecture Decision Records - 技術選定の理由と背景を記録

---

## ドキュメント構造

```
docs/
├── README.md                      # このファイル
├── TESTING.md                     # テスト実行・メンテナンス
├── setup/
│   └── SETUP.md                   # セットアップ手順
├── deployment/
│   ├── DEPLOYMENT.md              # デプロイ手順
│   ├── DATA_MIGRATION.md          # データ移行
│   └── SECURITY_CHECKLIST.md      # セキュリティチェック
├── operations/
│   ├── OPERATIONS.md              # 運用手順
│   ├── RUNBOOK.md                 # インシデント対応手順書
│   └── TROUBLESHOOTING.md         # トラブルシューティング
├── architecture/
│   └── SYSTEM_ARCHITECTURE.md     # システムアーキテクチャ
├── adr/
│   ├── README.md                  # ADR一覧
│   ├── 0001-use-drizzle-orm.md
│   ├── 0002-use-authjs-v5.md
│   ├── 0003-use-tailwind-css-v4.md
│   ├── 0004-use-date-type-for-anniversaries.md
│   ├── 0005-use-dayjs.md
│   └── 0006-use-nextjs-16-app-router.md
└── reference/
    ├── TECH_DECISIONS.md          # 技術的決定
    └── TODO.md                    # タスク管理
```

---

## AIフレンドリーな構成

このドキュメント構造は、AIが探しやすいように設計されています：

- **用途別フォルダ**: deployment, operations など目的が明確
- **フラット階層**: 1階層のみでシンプル
- **明確な命名**: ファイル名から内容が推測可能
- **Globパターン**: `docs/deployment/*.md` で検索しやすい
