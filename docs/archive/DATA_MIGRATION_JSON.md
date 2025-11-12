# データ移行ガイド（JSON方式）

recordingAnniversaries8（ra8）から recordingAnniversaries9（ra9）へのデータ移行手順。

## 概要

### 移行方式

**エクスポート → インポート方式**を採用。

```
ra8 MySQL DB
    ↓ エクスポート（ra8側で実行）
export.json（中間ファイル）
    ↓ インポート（ra9側で実行）
ra9 MySQL DB
```

### 利点

- **段階的な作業**: エクスポート → 確認 → インポート
- **デバッグしやすい**: JSON を目視確認可能
- **各プロジェクトのORMを活用**: Laravel Eloquent と Drizzle ORM
- **テストしやすい**: 何度でもインポートをやり直せる

---

## 移行対象データ

### ✅ 移行可能

| ra8 | ra9 | 移行内容 |
|-----|-----|---------|
| `users` | `users` | ユーザー情報（id は BIGINT → UUID 変換） |
| `entities` | `collections` | グループ情報（カラム名変更あり） |
| `days` | `anniversaries` | 記念日情報（カラム名変更あり） |

### ❌ 移行不可（ユーザーが再設定）

| ra8 | ra9 | 理由 |
|-----|-----|------|
| `users.google_id` | `accounts` テーブル | Auth.js のスキーマが異なる。初回ログイン時に自動作成される |
| `sessions` | `sessions` | スキーマが異なる。再ログイン必要 |
| `webauthn_credentials` | `authenticators` | スキーマが異なる。Passkey 再登録必要 |
| `users.password` | - | ra9 は Google OAuth のみ。email/password 未実装 |

### 移行対象ユーザー

**6ユーザー**のみ移行（テストアカウント除外）:
- id=1, 3, 5, 7, 8, 9

**除外**: id=2, 4, 6（テストアカウント）

---

## JSONフォーマット仕様

### 構造

```json
{
  "version": "1.0",
  "exported_at": "2025-01-15T10:00:00+09:00",
  "source": "recordingAnniversaries8",
  "stats": {
    "total_users": 6,
    "total_collections": 12,
    "total_anniversaries": 48
  },
  "users": [
    {
      "old_id": 1,
      "new_uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "takemitsu",
      "email_verified": null,
      "created_at": "2015-04-03T10:51:57+09:00",
      "updated_at": "2025-10-29T20:08:14+09:00",
      "collections": [
        {
          "old_id": 10,
          "name": "家族",
          "description": "家族の記念日",
          "is_visible": 1,
          "created_at": "2024-01-02T00:00:00+09:00",
          "updated_at": "2024-01-02T00:00:00+09:00",
          "anniversaries": [
            {
              "old_id": 100,
              "name": "太郎の誕生日",
              "description": "毎年お祝い",
              "anniversary_date": "2014-11-01",
              "created_at": "2024-01-03T00:00:00+09:00",
              "updated_at": "2024-01-03T00:00:00+09:00"
            }
          ]
        }
      ]
    }
  ]
}
```

### フィールド仕様

#### users

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `old_id` | number | ✅ | ra8 の users.id（参照用） |
| `new_uuid` | string | ✅ | ra9 用の UUID（エクスポート時に生成） |
| `email` | string | ✅ | メールアドレス |
| `name` | string \| null | ✅ | ユーザー名 |
| `email_verified` | string \| null | ✅ | メール認証日時（ISO 8601） |
| `created_at` | string | ✅ | 作成日時（ISO 8601） |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） |
| `collections` | array | ✅ | 所属する collections |

#### collections

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `old_id` | number | ✅ | ra8 の entities.id（参照用） |
| `name` | string | ✅ | グループ名 |
| `description` | string \| null | ✅ | 説明（ra8: `desc`） |
| `is_visible` | number | ✅ | 表示/非表示（ra8: `status`） |
| `created_at` | string | ✅ | 作成日時（ISO 8601） |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） |
| `anniversaries` | array | ✅ | 所属する anniversaries |

#### anniversaries

| フィールド | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `old_id` | number | ✅ | ra8 の days.id（参照用） |
| `name` | string | ✅ | 記念日名 |
| `description` | string \| null | ✅ | 説明（ra8: `desc`） |
| `anniversary_date` | string | ✅ | 記念日（YYYY-MM-DD、ra8: `anniv_at`） |
| `created_at` | string | ✅ | 作成日時（ISO 8601） |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） |

### 重要なルール

1. **UUID生成**: エクスポート時に `new_uuid` を生成（`crypto.randomUUID()` など）
2. **論理削除除外**: `deleted_at IS NULL` のみ
3. **日時フォーマット**: ISO 8601（タイムゾーン付き推奨）
4. **null の明示**: 空文字列ではなく `null` を使用
5. **階層構造**: users → collections → anniversaries のネスト
6. **対象ユーザー**: id=1,3,5,7,8,9 のみ

---

## 移行手順

### 前提条件

- ra8: Laravel 11 が動作している
- ra9: Next.js 16 が動作している
- 両方のDBにアクセス可能
- Node.js 18+ がインストール済み

### Step 1: ra8 でエクスポート

**ra8 のプロジェクトディレクトリで実行**（詳細は `RA8_EXPORT_SPEC.md` 参照）

```bash
cd /path/to/recordingAnniversaries8

# エクスポートスクリプト実行（ra8側で作成）
php artisan export:data export.json

# または npm コマンド（実装による）
npm run export
```

**出力**: `export.json`

### Step 2: JSONファイル確認

```bash
# ファイルサイズ確認
ls -lh export.json

# 統計情報確認
cat export.json | jq '.stats'

# ユーザー数確認
cat export.json | jq '.users | length'

# 特定ユーザーのデータ確認
cat export.json | jq '.users[] | select(.email == "user@example.com")'
```

### Step 3: export.json を ra9 へコピー

```bash
# ファイルをコピー（例）
cp /path/to/ra8/export.json /path/to/ra9/export.json
```

### Step 4: ra9 でインポート（テスト環境）

**重要**: 最初は必ず **テストDB** で実行してください。

```bash
cd /path/to/recordingAnniversaries9

# 環境変数を明示的に指定してインポート実行
DATABASE_URL="mysql://user:password@localhost:3306/ra9_test" npm run import:data export.json
```

**注意**: `import-data.ts`スクリプトは`.env.local`を自動読み込みしないため、`DATABASE_URL`を明示的に指定する必要があります。

**出力例**:
```
Reading export.json...
✓ Parsed: 6 users, 12 collections, 48 anniversaries

Starting import...
✓ Imported user: user1@example.com (3 collections, 10 anniversaries)
✓ Imported user: user2@example.com (2 collections, 8 anniversaries)
✓ Imported user: user3@example.com (1 collections, 5 anniversaries)
✓ Imported user: user4@example.com (2 collections, 9 anniversaries)
✓ Imported user: user5@example.com (3 collections, 12 anniversaries)
✓ Imported user: user6@example.com (1 collections, 4 anniversaries)

✅ Import completed successfully!
Total imported: 6 users, 12 collections, 48 anniversaries
```

### Step 5: テストDB検証

```bash
# MySQL接続
mysql -h localhost -u user -p ra9_test

# ユーザー数確認
SELECT COUNT(*) FROM users;

# Collection数確認
SELECT COUNT(*) FROM collections;

# Anniversary数確認
SELECT COUNT(*) FROM anniversaries;

# 特定ユーザーのデータ確認
SELECT u.email, c.name, a.name
FROM users u
JOIN collections c ON c.user_id = u.id
JOIN anniversaries a ON a.collection_id = c.id
WHERE u.email = 'user@example.com';
```

### Step 6: ra9 アプリで動作確認

```bash
# ra9 を起動（テストDB使用）
DATABASE_URL="mysql://user:password@localhost:3306/ra9_test" npm run dev
```

1. Google OAuth でログイン（移行したメールアドレスを使用）
2. ダッシュボードで記念日が表示されることを確認
3. Collection/Anniversary の編集・削除が正常に動作することを確認

### Step 7: 本番DBへ移行

**テスト環境で問題がなければ本番DBへ**

```bash
# 本番DB バックアップ（念のため）
mysqldump -h localhost -u user -p ra9 > ra9_backup_$(date +%Y%m%d_%H%M%S).sql

# 本番DBにインポート
DATABASE_URL="mysql://user:password@localhost:3306/ra9" npm run import:data export.json
```

### Step 8: 本番環境での動作確認

1. 各ユーザーが Google OAuth でログインできることを確認
2. データが正しく移行されていることを確認

---

## トラブルシューティング

### エラー: `duplicate key value violates unique constraint`

**原因**: すでにデータが存在している

**対応**:
```sql
-- テストDBをクリーンアップ
TRUNCATE TABLE anniversaries;
TRUNCATE TABLE collections;
DELETE FROM users;
```

### エラー: `foreign key constraint fails`

**原因**: UUID または外部キーの不整合

**対応**:
- `export.json` の `new_uuid` が正しいか確認
- インポート順序（users → collections → anniversaries）が守られているか確認

### エラー: `Cannot find module 'export.json'`

**原因**: JSONファイルのパスが間違っている

**対応**:
```bash
# 絶対パスで指定
npm run import:data /absolute/path/to/export.json

# または相対パス
npm run import:data ./export.json
```

### データ不整合

**問題**: インポート後、一部のデータが表示されない

**確認方法**:
```sql
-- 論理削除データが混入していないか
SELECT * FROM collections WHERE deleted_at IS NOT NULL;

-- 外部キーが正しいか
SELECT c.* FROM collections c
LEFT JOIN users u ON c.user_id = u.id
WHERE u.id IS NULL;
```

---

## ロールバック手順

### テスト環境

```bash
# テストDBをクリーンアップして再実行
mysql -h localhost -u user -p ra9_test < /path/to/clean_schema.sql
npm run import:data export.json
```

### 本番環境

```bash
# バックアップから復元
mysql -h localhost -u user -p ra9 < ra9_backup_YYYYMMDD_HHMMSS.sql
```

---

## チェックリスト

### エクスポート前

- [ ] ra8 のDBバックアップを取得
- [ ] 論理削除データが除外されることを確認
- [ ] 対象ユーザー（id=1,3,5,7,8,9）のみエクスポートされることを確認

### インポート前

- [ ] `export.json` の統計情報を確認（`jq '.stats'`）
- [ ] ra9 テストDBが空であることを確認
- [ ] ra9 本番DBのバックアップを取得

### インポート後

- [ ] ユーザー数が正しいか確認（6人）
- [ ] Collection数が正しいか確認
- [ ] Anniversary数が正しいか確認
- [ ] 各ユーザーが Google OAuth でログインできることを確認
- [ ] ダッシュボードでデータが表示されることを確認
- [ ] 編集・削除が正常に動作することを確認

---

## FAQ

### Q1. なぜ SQL 直接実行ではなく JSON 方式を選んだのか？

**A**: 以下の理由で JSON 方式を採用しました。

- **デバッグしやすい**: 中間ファイルを確認できる
- **段階的な作業**: エクスポート → 確認 → インポート
- **各プロジェクトのORMを活用**: 型安全で保守しやすい
- **テストしやすい**: 何度でもやり直せる

### Q2. email/password ユーザーはどうなるのか？

**A**: ra9 は Google OAuth のみサポート。email/password 認証は未実装です。

**移行対象の全ユーザーは Gmail または Google Workspace を使用しているため問題ありません。**

### Q3. Passkey は移行できないのか？

**A**: Laragear/WebAuthn（ra8）と Auth.js WebAuthn（ra9）でスキーマが異なるため、移行不可です。

**対応**: ユーザーは ra9 で Passkey を新規登録する必要があります（Google OAuth もあるので問題なし）。

### Q4. 移行後、ユーザーは何をする必要があるのか？

**A**: 初回ログイン時に「Googleでログイン」をクリックするだけです。

Auth.js が email で既存ユーザーを自動認識し、データが紐付けられます。

### Q5. 移行中のダウンタイムはどれくらいか？

**A**:
- **エクスポート**: ra8 は稼働したまま実行可能（数秒〜数分）
- **インポート**: ra9 側で実行（数秒〜数分）

**ra8 を停止する必要はありません。ra9 デプロイ前に移行すればダウンタイムなしで移行可能です。**

---

## 参考

- [RA8_EXPORT_SPEC.md](./RA8_EXPORT_SPEC.md) - ra8側のエクスポート仕様書
- [DEPLOYMENT.md](./DEPLOYMENT.md) - ra9のデプロイ手順
- [Auth.js Documentation](https://authjs.dev/) - 認証の仕組み
