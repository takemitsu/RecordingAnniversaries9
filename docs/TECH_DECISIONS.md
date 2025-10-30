# 技術的な決定事項

## データベース設計

### DATE vs DATETIME

**決定**: 記念日フィールド（`days.anniv_at`）には **DATE 型**を使用

**理由**:
- 記念日は日付のみで時刻情報は不要
- 年次繰り返し計算が簡単（月日のみで比較）
- タイムゾーンの問題を回避

### ソフトデリート

**決定**: `entities` と `days` テーブルで `deleted_at` カラムを使用したソフトデリート

**理由**:
- ユーザーの大切な記念日データを誤削除から保護
- データの復元が可能
- 将来的な分析やバックアップに有用

## 認証

### Auth.js v5 vs Better Auth

**決定**: まず **Auth.js v5** を試す。peer dependency エラーが解決しない場合は Better Auth を検討

**理由**:
- Auth.js は Next.js との統合が公式サポート
- Google OAuth の実装が簡単
- WebAuthn (Passkey) のサポートあり
- 既存の Laravel Socialite からの移行パスが明確

### Passkey実装

**決定**: `@simplewebauthn/server` と `@simplewebauthn/browser` を使用

**理由**:
- Auth.js の WebAuthn プロバイダーとの統合が可能
- 実装例が豊富
- クロスプラットフォーム対応

## ORM

### Drizzle ORM vs Prisma

**決定**: **Drizzle ORM**を使用

**理由**:
- TypeScript ファーストで型安全性が高い
- 軽量でパフォーマンスが良い
- SQL に近い構文で学習コストが低い
- Next.js 16 との相性が良い
- Auth.js の Drizzle アダプターが存在

## UI/スタイリング

### CSS Framework

**決定**: **Tailwind CSS v4**

**理由**:
- 既存プロジェクトで使用しており移行が容易
- ユーティリティファーストで開発速度が速い
- ダークモード対応が簡単
- Next.js とのエコシステムが成熟

### コンポーネントライブラリ

**決定**: 当面は Headless UI または shadcn/ui を検討

**理由**:
- Tailwind との親和性が高い
- カスタマイズ性が高い
- アクセシビリティ対応

## 日付ライブラリ

### dayjs vs date-fns

**決定**: **dayjs**を使用

**理由**:
- 既存プロジェクトで使用しており移行が容易
- 軽量（2KB）
- Moment.js 互換の API で使いやすい
- 日本語ロケール対応

## ビルドツール

### Webpack vs Turbopack

**決定**: **Turbopack** (Next.js 16 デフォルト)

**理由**:
- Next.js 16 で推奨
- 開発時のビルド速度が高速
- HMR (Hot Module Replacement) が高速

## 開発ツール

### Linter/Formatter

**決定**: **Biome**

**理由**:
- ESLint + Prettier を統合した高速ツール
- 設定がシンプル
- TypeScript サポートが優秀
- create-next-app でサポート

## キャッシング戦略

### Next.js 16 のキャッシング

**決定**: "use cache" ディレクティブを明示的に使用

**理由**:
- Next.js 16 では明示的なキャッシング制御が推奨
- パフォーマンス最適化
- データの鮮度をコントロール可能

**適用箇所**:
- 日付計算結果（日単位でキャッシュ）
- ユーザーの entities/days 一覧（変更時に再検証）

## Server Actions

### API Routes vs Server Actions

**決定**: **Server Actions** を優先的に使用

**理由**:
- Next.js 16 App Router で推奨
- クライアント・サーバー間のコード共有が容易
- TypeScript の型安全性を維持
- コード量が削減できる

## 未決定事項

### 1. Passkey の保存先
- Auth.js のデフォルトテーブルを使用するか
- カスタムテーブル（webauthn_credentials）を使用するか
- → Auth.js のドキュメントを確認後に決定

### 2. 本番環境のDBマイグレーション戦略
- Drizzle Kit の push を使用するか
- マイグレーションファイルを生成して管理するか
- → 開発が進んでから決定

### 3. エラーハンドリング戦略
- error.tsx の配置方法
- グローバルエラーハンドリング
- → UI実装時に決定
