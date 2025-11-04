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
- [ ] Collectionの並び替え機能
- [ ] 記念日の並び替え機能
- [ ] 記念日の検索・フィルター機能
- [ ] カレンダー表示
- [ ] 通知機能（メール/プッシュ通知）
- [ ] 記念日のインポート/エクスポート

### UI/UX
- [ ] アニメーション追加
- [ ] アクセシビリティさらなる改善

### パフォーマンス
- [ ] **"use cache"ディレクティブの追加**
  - 現状: `cache()` 関数は追加済み
  - 追加検討: `"use cache"` ディレクティブでNext.js 16のキャッシング最適化
  - 対象: Server Components、データフェッチ関数
  - 注意: キャッシュ無効化戦略の設計が必要

- [ ] **Dynamic imports（動的インポート）の導入**
  - 対象候補:
    - `components/forms/*` - フォームコンポーネント
    - `components/layout/Header.tsx` - ハンバーガーメニュー
    - dayjs、Drizzle
  - 効果: 初期ロード時間短縮、バンドルサイズ削減

- [ ] **React Compiler の検討**
  - 現状: Next.js 16で安定版config未提供
  - 調査: Next.js 16.1+ での対応状況
  - 効果: 自動メモ化によるパフォーマンス向上

- [ ] 画像最適化
  - Next.js Image コンポーネントの活用（現状は画像未使用）

- [ ] **Core Web Vitals 測定**
  - `next/web-vitals` を使用した測定実装
  - Vercel Analytics / Google Analytics 統合
  - LCP、FID、CLS のモニタリング

### コード品質
- [ ] **Zodバリデーションの導入**
  - Server Actions のフォームバリデーション強化
  - 型安全性向上（FormData → Zod schema → TypeScript types）
  - 対象: `app/actions/collections.ts`, `app/actions/anniversaries.ts`
  - 現状: 手動バリデーションのみ

- [ ] **FormData ヘルパー関数の作成**
  - `lib/utils/formData.ts` の作成
  - 共通パターンの抽出（trim、null変換、数値変換）
  - 型安全なFormDataパーサー実装

- [ ] **Magic numbers の定数化**
  - ハードコードされた数値の定数化
  - 例: レート制限の閾値、ページネーション、タイムアウト値
  - `lib/constants.ts` への統合

- [ ] **未使用変数・import のクリーンアップ**
  - Biomeで検出された未使用コードの削除
  - Dead code elimination
  - 定期的なコードレビュー

- [ ] **エラーハンドリングの強化**
  - Server Actionsのエラーレスポンス統一
  - クライアント側のエラー表示改善
  - エラーログ集約（Sentry等の検討）
  - リトライロジックの実装

### データベース
- [ ] **クエリ型安全性の向上**
  - Drizzle prepared statements の活用
  - クエリビルダーの型推論改善
  - N+1問題の検証と対策

- [ ] **データベース接続プーリング最適化**
  - 接続数の監視と調整
  - タイムアウト設定の最適化
  - 本番環境でのコネクションプール設定

### テスト
- [ ] E2Eテスト（Playwright）
- [ ] Unitテスト（Vitest）
- [ ] 統合テスト

### 開発環境
- [ ] **環境変数の型安全性向上**
  - `lib/env.ts` の作成（Zod + process.env）
  - 環境変数の自動補完とバリデーション
  - ビルド時の環境変数チェック
  - 例: `@t3-oss/env-nextjs` パターンの採用

- [ ] **ドキュメント更新**
  - `CLAUDE.md` の最新状態への更新
  - `docs/TECH_DECISIONS.md` の拡充
  - API仕様書の作成（Server Actions）
  - セキュリティ対策のドキュメント化

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
- [ ] ドメイン設定
- [ ] SSL証明書

## 優先度

### Critical（最優先）
- Passkey実装（セキュリティ強化）

### High
- Zodバリデーションの導入（セキュリティ・コード品質）
- エラーハンドリングの強化（信頼性）
- テスト実装（品質保証）
- 環境変数の型安全性向上（開発体験）
- デプロイ準備

### Medium
- 検索・フィルター機能
- カレンダー表示
- 通知機能
- 並び替え機能
- "use cache"ディレクティブの追加
- Dynamic imports の導入
- クエリ型安全性の向上
- FormData ヘルパー関数の作成

### Low
- Server Actionsレート制限の実装（認証済みアプリではリスク低）
- UI細部調整
- アニメーション
- Core Web Vitals 測定
- Magic numbers の定数化
- 未使用変数・import のクリーンアップ
- React Compiler の検討
- データベース接続プーリング最適化
- ドキュメント更新

## 実装完了済み ✅

### 2025-11（Next.js 16リファクタリング）
- ✅ **CVE-2025-29927対策**: proxy.ts削除、多層認証防御の実装
- ✅ **Data Layer認証チェック**: lib/db/queries.ts全メソッドにverifyUserAccess()追加
- ✅ **Data Layer DRY化**: lib/db/auth-helpers.ts作成、UnauthorizedErrorクラス実装
- ✅ **CSRF対策**: Next.js 16組み込み対応を確認・ドキュメント化（next.config.ts）
- ✅ **React 19 cache()**: Server Actionsの読み取り系に適用
- ✅ **Next.js 16 metadata**: viewport分離、Open Graph対応
- ✅ **Error Boundary**: app/(main)/error.tsx作成
- ✅ **Loading UI**: app/(main)/loading.tsx作成
- ✅ **Auth Error Page**: app/auth/error/page.tsx作成
- ✅ **Biome 2.3.3**: Tailwind CSS directive対応
- ✅ **Accessibility**: Header backdrop改善（button化）
- ✅ **Production console.log removal**: next.config.ts設定
