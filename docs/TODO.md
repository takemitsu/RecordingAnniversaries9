# TODO

## 未実装・今後の拡張 🚧

### セキュリティ強化
- [ ] **Server Actionsレート制限の実装**（優先度: Low）
  - 認証済みアプリではリスク低（悪意のある正規ユーザーのみ）
  - 本番デプロイ前に再検討
  - 実装候補:
    - `upstash/ratelimit` + Redis/Vercel KV（本番推奨）
    - カスタムメモリベース実装（開発環境向け）
  - 推奨レート: 10-20 req/min（フォーム送信）、60 req/min（読み取り）

### 認証
- [ ] Passkey（WebAuthn）実装
  - Auth.js v5の対応待ちまたはカスタム実装が必要
  - `@simplewebauthn/server`, `@simplewebauthn/browser` インストール済み

### 機能
- [ ] ブラウザプッシュ通知（検討）

### UI/UX
- [ ] アクセシビリティさらなる改善

### コード品質
- [x] **Zodバリデーションの導入** ✅ 完了
  - Server Actions のフォームバリデーション強化
  - 型安全性向上（FormData → Zod schema → TypeScript types）
  - フィールドごとのエラー表示対応
  - スキーマ: `lib/schemas/collection.ts`, `lib/schemas/anniversary.ts`
  - 実装: `app/actions/collections.ts`, `app/actions/anniversaries.ts`
  - UI: `components/forms/CollectionForm.tsx`, `components/forms/AnniversaryForm.tsx`

- [x] **環境変数の型安全性向上** ✅ 完了
  - `lib/env.ts` の作成（Zod + process.env）
  - 環境変数の自動補完とバリデーション
  - ビルド時の環境変数チェック（next.config.tsで実行）
  - シンプルなZodバリデーション採用（@t3-oss/env-nextjsは不採用）

### テスト

- [x] **Phase 1実装完了: Unit Tests** ✅ 完了（2025-11-04）
  - 日付計算（14テスト）- `lib/utils/dateCalculation.test.ts`
  - 和暦変換（14テスト）- `lib/utils/japanDate.test.ts`
  - Zodスキーマ（27テスト）- `lib/schemas/*.test.ts`
  - カバレッジ: utils 98%+, schemas 100%
  - 55テスト全通過

- [x] **Phase 2実装完了: Integration Tests** ✅ 完了（2025-11-05）
  - Server Actions + MySQL テストDB（TEST_DATABASE_URL）
  - Collections CRUD（14テスト）- `__tests__/app/actions/collections.integration.test.ts`
  - Anniversaries CRUD（10テスト）- `__tests__/app/actions/anniversaries.integration.test.ts`
  - Profile（3テスト）- `__tests__/app/actions/profile.integration.test.ts`
  - 認証・権限分離テスト実装済み
  - CASCADE削除動作の検証
  - 27テスト全通過

- [ ] **Phase 3: Component Tests** 🚧 次の課題
  - フォーム（CollectionForm, AnniversaryForm, ProfileForm）
  - カード（CollectionCard, AnniversaryCard）
  - ボタン（Button）
  - React Testing Library使用

- [ ] **Phase 4: E2E Tests** 🚧 将来の課題
  - Playwright + 認証モック
  - Collection/Anniversary CRUD フロー
  - ダッシュボード表示確認
  - プロフィール設定

**詳細**: `docs/TEST_STRATEGY.md` 参照

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
