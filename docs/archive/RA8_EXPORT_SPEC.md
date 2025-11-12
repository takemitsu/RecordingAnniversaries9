# ra8 データエクスポート仕様書

recordingAnniversaries8（ra8）から recordingAnniversaries9（ra9）へのデータ移行用エクスポートスクリプトの仕様書。

この仕様書は **ra8 側の Claude** に渡して、エクスポートスクリプトを作成してもらうためのものです。

---

## 概要

### 目的

ra8 の MySQL データベースから以下のデータをエクスポートし、JSON形式で出力する。

- **users** テーブル（対象ユーザーのみ）
- **entities** テーブル（論理削除除外）
- **days** テーブル（論理削除除外）

### 出力ファイル

- **ファイル名**: `export.json`
- **フォーマット**: JSON（インデントなし、圧縮形式）
- **文字コード**: UTF-8

---

## 対象データ

### 対象ユーザー（6人）

以下の **6ユーザーのみ**をエクスポートする（テストアカウント除外）。

| id | 備考 |
|----|------|
| 1 | Google OAuth |
| 3 | email/password（Gmail） |
| 5 | Google OAuth + password |
| 7 | email/password（Workspace） |
| 8 | email/password（Workspace） |
| 9 | Google OAuth |

**除外するユーザー**: id=2, 4, 6（テストアカウント）

### 論理削除データの除外

- **entities**: `deleted_at IS NULL` のみ
- **days**: `deleted_at IS NULL` のみ
- **users**: 論理削除なし（全レコード対象）

### エクスポート対象外

以下のテーブルは**エクスポート不要**（ra9 では再設定が必要なため）:

- `sessions`
- `webauthn_credentials`
- `password_reset_tokens`
- `cache`, `jobs`, `failed_jobs` など

---

## JSONフォーマット仕様

### 全体構造

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
  "users": [ /* UserData[] */ ]
}
```

### users（配列）

各ユーザーは以下の構造:

```json
{
  "old_id": 1,
  "new_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "takemitsu",
  "email_verified": null,
  "created_at": "2015-04-03T10:51:57+09:00",
  "updated_at": "2025-10-29T20:08:14+09:00",
  "collections": [ /* CollectionData[] */ ]
}
```

#### フィールド説明

| フィールド | 型 | 必須 | 説明 | ra8のカラム |
|-----------|---|------|------|-----------|
| `old_id` | number | ✅ | ra8 の users.id | `id` |
| `new_uuid` | string | ✅ | ra9用のUUID（新規生成） | - |
| `email` | string | ✅ | メールアドレス | `email` |
| `name` | string \| null | ✅ | ユーザー名 | `name` |
| `email_verified` | string \| null | ✅ | メール認証日時（ISO 8601） | `email_verified_at` |
| `created_at` | string | ✅ | 作成日時（ISO 8601） | `created_at` |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） | `updated_at` |
| `collections` | array | ✅ | 所属する collections | - |

**重要**:
- `new_uuid` は **エクスポート時に新規生成**する（`Str::uuid()` など）
- `email_verified_at` が NULL の場合、`null` を出力

### collections（配列）

各 collection は以下の構造:

```json
{
  "old_id": 10,
  "name": "家族",
  "description": "家族の記念日",
  "is_visible": 1,
  "created_at": "2024-01-02T00:00:00+09:00",
  "updated_at": "2024-01-02T00:00:00+09:00",
  "anniversaries": [ /* AnniversaryData[] */ ]
}
```

#### フィールド説明

| フィールド | 型 | 必須 | 説明 | ra8のカラム |
|-----------|---|------|------|-----------|
| `old_id` | number | ✅ | ra8 の entities.id | `id` |
| `name` | string | ✅ | グループ名 | `name` |
| `description` | string \| null | ✅ | 説明 | `desc` |
| `is_visible` | number | ✅ | 表示/非表示（0 or 1） | `status` |
| `created_at` | string | ✅ | 作成日時（ISO 8601） | `created_at` |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） | `updated_at` |
| `anniversaries` | array | ✅ | 所属する anniversaries | - |

**重要**:
- ra8 の `entities.desc` → ra9 の `description`
- ra8 の `entities.status` → ra9 の `is_visible`（値はそのまま）

### anniversaries（配列）

各 anniversary は以下の構造:

```json
{
  "old_id": 100,
  "name": "太郎の誕生日",
  "description": "毎年お祝い",
  "anniversary_date": "2014-11-01",
  "created_at": "2024-01-03T00:00:00+09:00",
  "updated_at": "2024-01-03T00:00:00+09:00"
}
```

#### フィールド説明

| フィールド | 型 | 必須 | 説明 | ra8のカラム |
|-----------|---|------|------|-----------|
| `old_id` | number | ✅ | ra8 の days.id | `id` |
| `name` | string | ✅ | 記念日名 | `name` |
| `description` | string \| null | ✅ | 説明 | `desc` |
| `anniversary_date` | string | ✅ | 記念日（YYYY-MM-DD） | `anniv_at` |
| `created_at` | string | ✅ | 作成日時（ISO 8601） | `created_at` |
| `updated_at` | string | ✅ | 更新日時（ISO 8601） | `updated_at` |

**重要**:
- ra8 の `days.desc` → ra9 の `description`
- ra8 の `days.anniv_at` → ra9 の `anniversary_date`
- `anniversary_date` は `YYYY-MM-DD` 形式（時刻なし）

---

## 実装要件

### 必須機能

1. **対象ユーザーのフィルタリング**
   ```php
   $targetUserIds = [1, 3, 5, 7, 8, 9];
   $users = User::whereIn('id', $targetUserIds)->get();
   ```

2. **論理削除データの除外**
   ```php
   $entities = Entity::whereNull('deleted_at')->get();
   $days = Day::whereNull('deleted_at')->get();
   ```

3. **UUID生成**
   ```php
   use Illuminate\Support\Str;

   $newUuid = (string) Str::uuid();
   ```

4. **ISO 8601 日時フォーマット**
   ```php
   $user->created_at->toIso8601String(); // "2015-04-03T10:51:57+09:00"
   ```

5. **階層構造の構築**
   - users → entities（collections） → days（anniversaries）
   - 外部キー参照は行わず、ネスト構造で表現

6. **統計情報の計算**
   ```php
   $stats = [
       'total_users' => count($users),
       'total_collections' => $users->sum(fn($u) => count($u->collections)),
       'total_anniversaries' => $users->sum(fn($u) =>
           $u->collections->sum(fn($c) => count($c->anniversaries))
       )
   ];
   ```

### 推奨実装方法

#### Artisan Command（推奨）

```php
// app/Console/Commands/ExportData.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Str;

class ExportData extends Command
{
    protected $signature = 'export:data {output=export.json}';
    protected $description = 'Export data for migration to ra9';

    public function handle()
    {
        $this->info('Starting export...');

        // 1. データ取得
        $targetUserIds = [1, 3, 5, 7, 8, 9];
        $users = User::whereIn('id', $targetUserIds)
            ->with(['entities' => function($query) {
                $query->whereNull('deleted_at')->with(['days' => function($q) {
                    $q->whereNull('deleted_at');
                }]);
            }])
            ->get();

        // 2. JSON構造の構築
        $data = [
            'version' => '1.0',
            'exported_at' => now()->toIso8601String(),
            'source' => 'recordingAnniversaries8',
            'users' => []
        ];

        foreach ($users as $user) {
            $newUuid = (string) Str::uuid();

            $userData = [
                'old_id' => $user->id,
                'new_uuid' => $newUuid,
                'email' => $user->email,
                'name' => $user->name,
                'email_verified' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at->toIso8601String(),
                'updated_at' => $user->updated_at->toIso8601String(),
                'collections' => []
            ];

            foreach ($user->entities as $entity) {
                $collectionData = [
                    'old_id' => $entity->id,
                    'name' => $entity->name,
                    'description' => $entity->desc,
                    'is_visible' => $entity->status,
                    'created_at' => $entity->created_at->toIso8601String(),
                    'updated_at' => $entity->updated_at->toIso8601String(),
                    'anniversaries' => []
                ];

                foreach ($entity->days as $day) {
                    $collectionData['anniversaries'][] = [
                        'old_id' => $day->id,
                        'name' => $day->name,
                        'description' => $day->desc,
                        'anniversary_date' => $day->anniv_at->format('Y-m-d'),
                        'created_at' => $day->created_at->toIso8601String(),
                        'updated_at' => $day->updated_at->toIso8601String(),
                    ];
                }

                $userData['collections'][] = $collectionData;
            }

            $data['users'][] = $userData;
        }

        // 3. 統計情報
        $data['stats'] = [
            'total_users' => count($data['users']),
            'total_collections' => collect($data['users'])->sum(fn($u) => count($u['collections'])),
            'total_anniversaries' => collect($data['users'])->sum(fn($u) =>
                collect($u['collections'])->sum(fn($c) => count($c['anniversaries']))
            )
        ];

        // 4. ファイル出力（圧縮形式）
        $output = $this->argument('output');
        file_put_contents($output, json_encode($data, JSON_UNESCAPED_UNICODE));

        $this->info("✓ Exported {$data['stats']['total_users']} users to {$output}");
        $this->info("  - Collections: {$data['stats']['total_collections']}");
        $this->info("  - Anniversaries: {$data['stats']['total_anniversaries']}");
    }
}
```

#### 実行方法

```bash
# デフォルト（export.json）
php artisan export:data

# ファイル名指定
php artisan export:data migration_2025-01-15.json
```

#### または npm script として実装

```bash
npm run export
```

---

## バリデーション

### エクスポート前の確認

```sql
-- 対象ユーザー数（6人であることを確認）
SELECT COUNT(*) FROM users WHERE id IN (1,3,5,7,8,9);

-- 論理削除されていない entities の数
SELECT COUNT(*) FROM entities
WHERE user_id IN (1,3,5,7,8,9)
AND deleted_at IS NULL;

-- 論理削除されていない days の数
SELECT COUNT(*) FROM days d
JOIN entities e ON d.entity_id = e.id
WHERE e.user_id IN (1,3,5,7,8,9)
AND d.deleted_at IS NULL
AND e.deleted_at IS NULL;
```

### エクスポート後の確認

```bash
# ファイルサイズ確認
ls -lh export.json

# JSON妥当性確認
cat export.json | jq '.' > /dev/null && echo "✓ Valid JSON"

# 統計情報確認
cat export.json | jq '.stats'

# ユーザー数確認
cat export.json | jq '.users | length'

# 特定ユーザーの確認
cat export.json | jq '.users[] | select(.email == "user@example.com")'
```

---

## エラーハンドリング

### よくあるエラー

1. **リレーションが読み込まれない**
   ```php
   // ❌ Bad
   $users = User::whereIn('id', $targetUserIds)->get();

   // ✅ Good
   $users = User::whereIn('id', $targetUserIds)
       ->with(['entities.days'])
       ->get();
   ```

2. **論理削除データが含まれる**
   ```php
   // ❌ Bad
   ->with(['entities'])

   // ✅ Good
   ->with(['entities' => function($query) {
       $query->whereNull('deleted_at');
   }])
   ```

3. **日時フォーマットが間違っている**
   ```php
   // ❌ Bad
   'created_at' => $user->created_at->format('Y-m-d H:i:s')

   // ✅ Good
   'created_at' => $user->created_at->toIso8601String()
   ```

4. **null が空文字列になる**
   ```php
   // ❌ Bad
   'description' => $entity->desc ?? ''

   // ✅ Good
   'description' => $entity->desc  // null のまま出力
   ```

---

## テスト

### 小規模テスト

特定のユーザー（例: id=1）だけエクスポートして動作確認:

```php
// 一時的に対象ユーザーを1人に変更
$targetUserIds = [1];
```

### 出力例の確認

エクスポート後、以下を確認:

```bash
# ユーザー1の詳細確認
cat export.json | jq '.users[0]'

# Collections の数
cat export.json | jq '.users[0].collections | length'

# Anniversaries の数
cat export.json | jq '.users[0].collections[0].anniversaries | length'
```

---

## チェックリスト

### 実装前

- [ ] ra8 のDBバックアップを取得
- [ ] Eloquent モデルのリレーション（`entities`, `days`）が正しく定義されているか確認

### 実装後

- [ ] 対象ユーザー（id=1,3,5,7,8,9）のみエクスポートされることを確認
- [ ] 論理削除データ（`deleted_at IS NOT NULL`）が除外されることを確認
- [ ] UUID が正しく生成されることを確認
- [ ] 日時が ISO 8601 形式であることを確認
- [ ] `stats` の数値が正しいことを確認
- [ ] JSONが妥当であることを確認（`jq '.' export.json`）

---

## 参考

- [DATA_MIGRATION_JSON.md](./DATA_MIGRATION_JSON.md) - 全体の移行手順
- [Laravel UUID](https://laravel.com/docs/11.x/strings#method-str-uuid) - UUID生成
- [Laravel Eloquent Relationships](https://laravel.com/docs/11.x/eloquent-relationships) - リレーション
- [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) - 日時フォーマット
