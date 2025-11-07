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
