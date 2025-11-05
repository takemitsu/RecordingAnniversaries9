# 技術的な決定事項

## データベース設計

### DATE vs DATETIME

**決定**: 記念日フィールド（`anniversaries.anniversary_date`）には **DATE 型**を使用

**理由**:
- 記念日は日付のみで時刻情報は不要
- 年次繰り返し計算が簡単（月日のみで比較）
- タイムゾーンの問題を回避

### ソフトデリート

**現状**: **未実装**

**計画**: `collections` と `anniversaries` テーブルで `deleted_at` カラムを使用したソフトデリート

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
- ユーザーの collections/anniversaries 一覧（変更時に再検証）

## Server Actions

### API Routes vs Server Actions

**決定**: **Server Actions** を優先的に使用

**理由**:
- Next.js 16 App Router で推奨
- クライアント・サーバー間のコード共有が容易
- TypeScript の型安全性を維持
- コード量が削減できる

## バリデーション

### Zodバリデーション

**決定**: **Zod** をServer Actionsのフォームバリデーションに使用

**理由**:
- **型安全性**: FormData → Zod → TypeScript（自動型推論、`as string`不要）
- **宣言的**: スキーマで一元管理、可読性向上
- **フィールドごとのエラー**: `flatten().fieldErrors`で複数フィールドのエラーを同時表示
- **クライアント・サーバー両対応**: 同じスキーマをReact Hook Form等でも使用可能（将来的に）
- **Next.js 16 + React 19のベストプラクティス**: useActionState + Zodが2025年の標準パターン

**実装パターン**:
```typescript
// Server Action
const result = schema.safeParse(rawData);
if (!result.success) {
  return {
    errors: result.error.flatten().fieldErrors,
    fieldValues: rawData, // フォーム値保持
  };
}
```

**対象**:
- `lib/schemas/collection.ts`: Collection作成・更新
- `lib/schemas/anniversary.ts`: Anniversary作成・更新

**React Hook Form 非採用の理由**:
- 現在のフォームはシンプル（3-5フィールド）
- useActionState + Zodで十分
- React Hook Form + useActionStateの統合は「hacky」（コミュニティ評価）
- 複雑なフォームが必要になったら再検討

### フォーム値保持（React 19対応）

**問題**: React 19のuseActionStateはフォーム送信時にフォームをリセット

**解決策**:
- Server ActionのFormStateに`fieldValues`を追加
- バリデーションエラー時に入力値も一緒に返す
- TSX側で`state?.fieldValues ?? defaultValue`で値を復元

**効果**:
- バリデーションエラー時もユーザーの入力値が失われない
- エラー修正時の再入力が不要（UX向上）

## テスト戦略

### テストツール選定

**決定**: **Vitest** + **React Testing Library** + **Playwright**

**理由**:
- **Vitest**: Vite互換、高速、Jestライクな使いやすさ
- **React Testing Library**: React 19対応、ユーザー視点のテスト（実装詳細に依存しない）
- **Playwright**: E2Eテスト、クロスブラウザ対応（Phase 4で実装予定）

### テストDB: MySQL vs SQLite

**決定**: **MySQL テストDB**（TEST_DATABASE_URL）

**理由**:
- **本番環境と同じDB**: 外部キー制約、DATE型の挙動を正確にテスト
- **CASCADE設計のテスト**: Collection削除時のAnniversaries自動削除を検証
- **型の正確性**: MySQLのDATE型とDrizzleの`date("anniversary_date", { mode: "string" })`の挙動確認
- **トレードオフ**: SQLiteより遅いが、本番環境と同じ挙動を保証（正確性 > 速度）

**設計判断**:
- `fileParallelism: false`: DB競合回避のため直列実行
- **TRUNCATE戦略**: `SET FOREIGN_KEY_CHECKS = 0` で外部キー制約を一時無効化し、高速クリーンアップ
- **globalSetup**: 全テスト実行前に1回だけマイグレーション実行（効率的）

### テスト実装順序

**決定**: Phase順に実装（Unit → Integration → Component → E2E）

**理由**:
- **ビジネスロジックから優先**: 日付計算、和暦変換が最重要
- **依存関係**: Integration Tests は Unit Tests に依存
- **段階的**: 各Phaseで品質を確保しながら進む

### 実装完了（Phase 1 + Phase 2）

- ✅ **Phase 1: Unit Tests**（55テスト）- 2025-11-04完了
  - 日付計算（14テスト）- `lib/utils/dateCalculation.test.ts`
  - 和暦変換（14テスト）- `lib/utils/japanDate.test.ts`
  - Zodスキーマ（27テスト）- `lib/schemas/*.test.ts`
  - カバレッジ: utils 98%+, schemas 100%

- ✅ **Phase 2: Integration Tests**（27テスト）- 2025-11-05完了
  - Collections CRUD（14テスト）- `__tests__/app/actions/collections.integration.test.ts`
  - Anniversaries CRUD（10テスト）- `__tests__/app/actions/anniversaries.integration.test.ts`
  - Profile更新（3テスト）- `__tests__/app/actions/profile.integration.test.ts`
  - 認証・権限分離テスト実装済み
  - CASCADE削除動作の検証

### 未実装（Phase 3, 4）

- **Phase 3: Component Tests** - フォーム、カード、ボタン
- **Phase 4: E2E Tests** - Playwright使用

詳細は `docs/TEST_STRATEGY.md` 参照。

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
