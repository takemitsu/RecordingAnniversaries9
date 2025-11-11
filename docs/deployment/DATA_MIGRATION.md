# データ移行ガイド（ra8 → ra9）

**重要**: このドキュメントはSQL直接実行方式の移行手順です。

**推奨方式**: [DATA_MIGRATION_JSON.md](./DATA_MIGRATION_JSON.md) のexport/import方式（JSON形式）を使用してください。
この方式の方がシンプルで、エラーが少なく、テストも容易です。

このSQL直接実行方式は、特別な理由がある場合のみ使用してください。

---

## 目次

1. [重要な注意事項](#重要な注意事項)
2. [スキーマ差分まとめ](#スキーマ差分まとめ)
3. [移行手順](#移行手順)
4. [トラブルシューティング](#トラブルシューティング)

---

## 重要な注意事項

ra8とra9はスキーマが大きく異なるため、**単純なmysqldumpでは移行できません**。

### 移行できるもの

- ✅ **users**（BIGINT → UUID変換が必要）
- ✅ **entities → collections**（テーブル名・カラム名変更）
- ✅ **days → anniversaries**（テーブル名・カラム名変更）

### 移行できないもの

- ❌ **Google OAuth連携** → Auth.jsで再連携が必要
- ❌ **sessions** → 再ログインが必要
- ❌ **webauthn_credentials → authenticators** → Passkey再登録が必要
- ❌ **password_reset_tokens** → 一時データ（移行不要）
- ❌ **cache, jobs系** → フレームワーク固有（移行不要）

---

## スキーマ差分まとめ

### アプリケーションテーブル（移行対象）

| ra8テーブル | ra9テーブル | 移行方法 | 備考 |
|-----------|-----------|---------|------|
| `users` | `users` | UUID変換して移行 | id: BIGINT → VARCHAR UUID |
| `entities` | `collections` | テーブル名・カラム名変更 | desc→description, status→is_visible |
| `days` | `anniversaries` | テーブル名・カラム名変更 | entity_id→collection_id, desc→description, anniv_at→anniversary_date |

### 認証関連テーブル

| ra8テーブル | ra9テーブル | 移行方法 | 備考 |
|-----------|-----------|---------|------|
| Google OAuth連携 | `accounts` | **移行不可** | Auth.jsで再連携が必要 |
| `sessions` (Laravel) | `sessions` (Auth.js) | **移行不可** | スキーマ全く異なる、再ログイン必要 |
| `webauthn_credentials` | `authenticators` | **移行不可** | スキーマ全く異なる、Passkey再登録必要 |
| `password_reset_tokens` | なし | **移行不要** | 一時データ、ra9はAuth.jsがメールリンクで処理 |

### フレームワーク固有テーブル（移行不要）

| ra8テーブル | 用途 | 移行方法 |
|-----------|-----|---------|
| `cache`, `cache_locks` | Laravelキャッシュ | **移行不要** |
| `jobs`, `job_batches`, `failed_jobs` | Laravelジョブキュー | **移行不要** |

### カラム差分詳細

| 項目 | ra8 (Laravel) | ra9 (Next.js) | 変換方法 |
|------|--------------|--------------|---------|
| **users.id** | BIGINT auto_increment | VARCHAR(255) UUID | UUID()で生成 |
| **users.google_id** | あり | なし | accountsテーブルで管理 |
| **users.password** | あり（nullable） | なし | ra9はOAuth/Passkeyのみ |
| **users.remember_token** | あり | なし | ra9はセッションで管理 |
| **users.email_verified_at** | TIMESTAMP | DATETIME | 型変更 |
| **entities.desc** | desc | description | カラム名変更 |
| **entities.status** | status (TINYINT) | is_visible (BOOLEAN) | カラム名変更 |
| **days.entity_id** | entity_id | collection_id | カラム名変更 |
| **days.desc** | desc | description | カラム名変更 |
| **days.anniv_at** | anniv_at | anniversary_date | カラム名変更 |
| **論理削除** | deleted_at あり | なし | deleted_at IS NULL のみ移行 |

---

## 移行手順

### 1. ra8データベースの全テーブル確認

```bash
# VPS上でra8の全テーブル一覧確認
mysql -u ra8user -p ra8_database -e "SHOW TABLES;"

# 移行対象データの件数確認
mysql -u ra8user -p ra8_database -e "
SELECT
  (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) as users_count,
  (SELECT COUNT(*) FROM entities WHERE deleted_at IS NULL) as entities_count,
  (SELECT COUNT(*) FROM days WHERE deleted_at IS NULL) as days_count,
  (SELECT COUNT(*) FROM webauthn_credentials) as webauthn_count,
  (SELECT COUNT(*) FROM sessions) as sessions_count,
  (SELECT COUNT(*) FROM password_reset_tokens) as password_reset_count;
"
```

**注意**:
- `webauthn_credentials`、`sessions`、`password_reset_tokens` は移行できません
- ユーザーは移行後、Google OAuthで再ログイン、Passkeyは再登録が必要です

### 2. データ移行スクリプト作成

`~/migrate_ra8_to_ra9.sql` を作成：

```sql
-- ============================================
-- ra8 → ra9 データ移行スクリプト
-- ============================================
-- 移行対象: users, entities (→collections), days (→anniversaries)
-- 移行不可: sessions, accounts, authenticators, webauthn_credentials
-- 移行不要: password_reset_tokens, cache, jobs系（一時データ・フレームワーク固有）
-- ============================================

-- 1. ra9データベースの準備（既存データを削除）
USE ra9;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE anniversaries;
TRUNCATE TABLE collections;
TRUNCATE TABLE users;
TRUNCATE TABLE accounts;
TRUNCATE TABLE sessions;
TRUNCATE TABLE authenticators;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. ユーザーデータ移行（IDをUUIDに変換）
-- 一時テーブルでIDマッピング作成
CREATE TEMPORARY TABLE user_id_mapping (
  old_id BIGINT UNSIGNED,
  new_id VARCHAR(255),
  PRIMARY KEY (old_id),
  UNIQUE KEY (new_id)
);

-- ra8のusersを取得してUUID生成
INSERT INTO user_id_mapping (old_id, new_id)
SELECT id, UUID() FROM ra8_database.users WHERE deleted_at IS NULL;

-- usersテーブルにデータ挿入
INSERT INTO ra9.users (id, name, email, email_verified, image, created_at, updated_at)
SELECT
  m.new_id,
  u.name,
  u.email,
  u.email_verified_at,
  NULL as image,
  u.created_at,
  u.updated_at
FROM ra8_database.users u
JOIN user_id_mapping m ON u.id = m.old_id
WHERE u.deleted_at IS NULL;

-- 3. Collectionsデータ移行（entities → collections）
INSERT INTO ra9.collections (id, user_id, name, description, is_visible, created_at, updated_at)
SELECT
  e.id,
  m.new_id as user_id,
  e.name,
  COALESCE(e.desc, '') as description,
  e.status as is_visible,
  e.created_at,
  e.updated_at
FROM ra8_database.entities e
JOIN user_id_mapping m ON e.user_id = m.old_id
WHERE e.deleted_at IS NULL;

-- 4. Anniversariesデータ移行（days → anniversaries）
INSERT INTO ra9.anniversaries (id, collection_id, name, description, anniversary_date, created_at, updated_at)
SELECT
  d.id,
  d.entity_id as collection_id,
  d.name,
  COALESCE(d.desc, '') as description,
  d.anniv_at as anniversary_date,
  d.created_at,
  d.updated_at
FROM ra8_database.days d
WHERE d.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM ra8_database.entities e WHERE e.id = d.entity_id AND e.deleted_at IS NULL);

-- 5. 移行結果確認
SELECT
  (SELECT COUNT(*) FROM ra9.users) as users_count,
  (SELECT COUNT(*) FROM ra9.collections) as collections_count,
  (SELECT COUNT(*) FROM ra9.anniversaries) as anniversaries_count;

-- 一時テーブル削除
DROP TEMPORARY TABLE IF EXISTS user_id_mapping;
```

### 3. データ移行実行

```bash
# VPS上で実行
mysql -u ra9user -p < ~/migrate_ra8_to_ra9.sql

# エラーがないか確認
echo $?  # 0なら成功
```

### 4. データ整合性確認

```bash
# MySQLにログイン
mysql -u ra9user -p ra9

# データ件数確認
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM collections) as collections,
  (SELECT COUNT(*) FROM anniversaries) as anniversaries,
  (SELECT COUNT(*) FROM accounts) as accounts,
  (SELECT COUNT(*) FROM sessions) as sessions,
  (SELECT COUNT(*) FROM authenticators) as authenticators;

# サンプルデータ確認
SELECT * FROM users LIMIT 3;
SELECT * FROM collections LIMIT 3;
SELECT * FROM anniversaries LIMIT 3;

EXIT;
```

### 5. ra9の動作確認

```bash
# ra9アプリケーションを起動（まだra8は稼働中）
cd ~/RecordingAnniversaries9
npm run build
pm2 start npm --name "ra9-app-test" -- start

# 別ポートで起動して動作確認
# ブラウザで http://ra.takemitsu.net にアクセス
# ログイン・データ表示を確認
```

**確認項目**:
- ✅ ユーザーがGoogle OAuthでログインできるか
  - **重要**: 初回は必ずGoogle OAuth再連携が必要（accountsテーブルが空のため）
- ✅ Collectionsが正しく表示されるか
- ✅ Anniversariesが正しく表示されるか
- ✅ カウントダウン・和暦表示が正常か

**注意事項**:
- Passkeyは移行できません。ユーザーは再登録が必要です
- セッションも移行できないため、全ユーザーが再ログインする必要があります

### 6. ra8停止

**重要**: ra8はLaravel + Inertia.js (SPA)で、**PM2管理ではありません**。

```bash
# Nginx設定を無効化
sudo mv /etc/nginx/conf.d/ra.conf /etc/nginx/conf.d/ra.conf.disabled_ra8

# Nginx設定テスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx

# PHP-FPM確認（必要に応じて）
sudo systemctl status php8.3-fpm
```

### 7. Nginx設定をra9に切り替え

```bash
# ra.conf が既に ra9 用に設定済み（DEPLOYMENT.mdの手順で作成済み）
# 設定ファイルの確認
sudo cat /etc/nginx/conf.d/ra.conf

# Nginx再起動
sudo systemctl restart nginx
```

---

## トラブルシューティング

### 問題: ユーザーIDのUUID変換でエラー

**対処法**: MySQLのバージョン確認。MySQL 8.0以上では `UUID()` 関数が使えます。

```bash
mysql --version
```

### 問題: 外部キー制約エラー

**対処法**: `SET FOREIGN_KEY_CHECKS = 0;` を確認。または、テーブルを順番に移行（users → collections → anniversaries）。

### 問題: ra9でログインできない

**原因**: Auth.jsの`accounts`/`sessions`テーブルが空のため。

**対処法**:
1. Google OAuthで再ログイン（**必須**: ra8の認証情報は移行不可）
2. Passkeyは新規登録が必要（**必須**: `webauthn_credentials` → `authenticators` への移行は不可）

**技術的背景**:
- ra8は`users.google_id`でOAuth連携を管理
- ra9はAuth.jsの`accounts`テーブルで管理（スキーマが全く異なる）
- ra8の`webauthn_credentials`（Laragear/WebAuthn）とra9の`authenticators`（Auth.js WebAuthn）はスキーマ互換性なし

### 問題: データが表示されない

**確認事項**:
1. `collections.is_visible` が 1 になっているか
2. `users.id` が正しくUUIDに変換されているか
3. 外部キー（collection_id）が正しく設定されているか

---

**ドキュメント作成日**: 2025-11-07
