# TODO

## 完了済み ✅

- [x] Next.js 16プロジェクト初期化
- [x] 依存関係インストール
- [x] Drizzleスキーマ定義（users, collections, anniversaries, accounts, sessions）
- [x] Auth.js v5設定（Google OAuth）
  - [x] Auth.js用DBテーブル作成（accounts, sessions）
  - [x] カスタムアダプター実装（AUTO_INCREMENT対応）
  - [x] Drizzleマイグレーション実行
  - [x] Google OAuth動作確認
- [x] Server Actions実装
  - [x] collections CRUD
  - [x] anniversaries CRUD
  - [x] profile更新
- [x] React 19統合
  - [x] useActionState統合（CollectionForm, AnniversaryForm, ProfileForm）
  - [x] HTML5バリデーション統合
  - [x] サーバーサイドエラーハンドリング
- [x] UI/UX実装（ra8準拠）
  - [x] 2ページ構成（`/`一覧、`/edit`編集）
  - [x] フルスクリーンフォーム
  - [x] CollectionCard/AnniversaryCard実装
  - [x] Header改修（ハンバーガーメニュー）
  - [x] Footer実装
  - [x] レスポンシブパディング（`p-2 lg:p-12`）
  - [x] カラフルなカウントダウン表示
  - [x] 日付表示フォーマット（西暦（和暦）形式）
- [x] プロフィール設定
  - [x] `/profile`ページ
  - [x] ユーザー名変更機能
- [x] 統一Buttonコンポーネント
- [x] 日付計算ロジック移植
  - [x] カウントダウン（年次繰り返し）
  - [x] カウントアップ
  - [x] 和暦変換
- [x] TypeScriptエラー修正
- [x] Biome Lint/Format
- [x] Next.js 16対応（proxy.ts使用）
- [x] ドキュメント作成・更新

## 未実装・今後の拡張 🚧

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
- [ ] "use cache"によるキャッシング最適化
- [ ] 画像最適化
- [ ] コード分割

### テスト
- [ ] E2Eテスト（Playwright）
- [ ] Unitテスト（Vitest）
- [ ] 統合テスト

### デプロイ
- [ ] 本番環境設定
- [ ] CI/CD設定
- [ ] ドメイン設定
- [ ] SSL証明書

## 優先度

### Critical（最優先）
- Passkey実装（セキュリティ強化）

### High
- テスト実装（品質保証）
- デプロイ準備

### Medium
- 検索・フィルター機能
- カレンダー表示
- 通知機能
- 並び替え機能

### Low
- UI細部調整
- アニメーション
- パフォーマンス最適化
