# TODO

## 完了済み ✅

- [x] Next.js 16プロジェクト初期化
- [x] 依存関係インストール
- [x] Drizzleスキーマ定義（users, entities, days, accounts, auth_sessions）
- [x] Auth.js v5設定（Google OAuth）
  - [x] Auth.js用DBテーブル作成（accounts, auth_sessions）
  - [x] カスタムアダプター実装（AUTO_INCREMENT対応）
  - [x] Drizzleマイグレーション実行
  - [x] Google OAuth動作確認
- [x] Server Actions実装
  - [x] entities CRUD
  - [x] days CRUD
- [x] UI構築
  - [x] 認証ページ
  - [x] ダッシュボード
  - [x] グループ管理
  - [x] 記念日管理
- [x] 日付計算ロジック移植
  - [x] カウントダウン（年次繰り返し）
  - [x] カウントアップ
  - [x] 和暦変換
- [x] TypeScriptエラー修正
- [x] Biome Lint/Format（2エラーは許容範囲）
- [x] Next.js 16対応（proxy.ts使用）
- [x] next-devtools-mcp動作確認
- [x] ドキュメント作成・更新

## 未実装・今後の拡張 🚧

### 認証
- [ ] Passkey（WebAuthn）実装
  - Auth.js v5の対応待ちまたはカスタム実装が必要
  - recordingAnniversaries8では`asbiin/laravel-webauthn`使用

### 機能
- [ ] 記念日の並び替え機能
- [ ] 記念日の検索・フィルター機能
- [ ] カレンダー表示
- [ ] 通知機能（メール/プッシュ通知）
- [ ] 記念日のインポート/エクスポート

### UI/UX
- [ ] **ra8設計への全面リファクタリング（最優先）**
  - 詳細: `docs/UI_REFACTORING_PLAN.md` 参照
  - [ ] react-datepicker導入
  - [ ] Header改修（ハンバーガーメニュー実装）
  - [ ] EntityCard/AnniversaryDayCard作成
  - [ ] ページ構成変更（`/`一覧、`/edit`編集）
  - [ ] フォームページ作成（フルスクリーン）
  - [ ] 既存ページ削除（dashboard, entities, days）
  - [ ] レスポンシブパディング調整（`p-2 lg:p-12`）
  - [ ] カラフルなカウントダウン表示
- [ ] アニメーション追加
- [ ] アクセシビリティ改善（残りBiomeエラー対応）

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

## 既知の問題

### Biome
- Modal/ConfirmDialogのbackdrop `role="button"` 警告（2件）
  - 機能的には問題なし（キーボードアクセシビリティ実装済み）
  - セマンティックな理由でdivを使用

### 環境変数
- ~~`.env.local`がプレースホルダーのまま~~ ✅ 設定完了
  - DATABASE_URL ✅
  - AUTH_SECRET ✅
  - GOOGLE_CLIENT_ID ✅
  - GOOGLE_CLIENT_SECRET ✅

## 優先度

### Critical（最優先）
- **UI/UXリファクタリング（ra8設計への回帰）**
  - 現在のUI設計に根本的な問題があるため、最優先で対応

### High
- Passkey実装（セキュリティ強化）
- テスト実装（品質保証）

### Medium
- 検索・フィルター機能
- カレンダー表示
- 通知機能

### Low
- UI細部調整
- アニメーション
- パフォーマンス最適化
