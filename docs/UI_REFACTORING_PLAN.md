# UI/UX全面リファクタリング計画

最終更新: 2025-10-30

## 概要

recordingAnniversaries9のUI/UXを、recordingAnniversaries8（ra8）の設計に完全に回帰させます。

ra9で追加した「改善」（統計ダッシュボード、Entity/Day独立ページ等）は、実際には不要な複雑化でした。ra8のシンプルで実用的な設計が正解であることが判明したため、全面的にリファクタリングします。

---

## ra8とra9の設計比較

### データ構造の本質

```
users (ユーザー)
  └─ entities (グループ: 家族、友人、仕事など)
      └─ days (記念日: 誕生日、記念日など)
```

**重要**: DayはEntityに属する。EntityがDayを所有する階層構造。

### ra8の設計：Entity中心（正しい設計）

#### ページ構成
- **`/` (Dashboard)**: Entity一覧（閲覧専用）
  - EntityごとにカードUI表示
  - 各EntityCard内にDaysをネスト表示
  - 記念日があるEntityのみ表示
  - データ構造を忠実に反映したUI

- **`/entities` (編集ページ)**: Entity管理画面
  - 全Entityを表示（記念日がなくてもOK）
  - Entity単位の操作: 削除、編集、Day追加
  - Day単位の操作: 削除、編集
  - 一画面で全ての管理が可能

#### データ取得パターン
```php
// 常にEntityを起点に取得
Entity::with('days')->where('user_id', $userId)->get();
```

- Entityを取得し、eager loadingでDaysも取得
- N+1問題なし
- データ構造に忠実

#### UI階層
```
EntityCard
  ├─ Entity情報（名前、説明）
  ├─ アクションボタン（削除、編集、Day追加）
  └─ Days（ネスト表示）
      └─ AnniversaryDayCard
          ├─ カウントダウン（カラフル）
          ├─ 和暦表示
          ├─ 年齢表示
          └─ アクションボタン（削除、編集）
```

#### UXフロー
1. **新しい記念日を追加する**
   - `/entities`（編集ページ）へ移動
   - 対象のEntityカードの「記念日追加」ボタンをクリック
   - `/entities/{entity_id}/days/create`へ遷移（**Entityは既に決まっている**）
   - フォーム入力（グループ選択は不要）
   - 保存後、`/entities`へリダイレクト

2. **記念日を編集する**
   - Entityは変更できない（固定）
   - 記念日の名前、日付、説明のみ編集可能

### ra9の設計：Entity/Day対等（誤った設計）

#### ページ構成
- **`/dashboard`**: 統計ダッシュボード
  - グループ数、記念日数の統計表示 ← **不要**
  - 直近5件の記念日のみ表示 ← **情報が欠落**

- **`/entities`**: Entity管理専用ページ
  - グループのみを管理
  - 記念日は別ページ

- **`/days`**: Day管理専用ページ ← **ra8にはない**
  - 全記念日をフラット表示
  - Entity情報をJOINして取得 ← **クエリコストは変わらない**

#### データ取得パターン
```typescript
// EntityとDayを独立して取得
const entities = await getEntities();
const allDays = await getAllDays();  // ← Entity経由せず直接取得

// Daysをフラット化
userEntities.flatMap(entity =>
  entity.days.map(day => ({ ...day, entity }))
);
```

- EntityとDayを対等に扱う
- フラット化処理が必要
- データ構造と乖離

#### UXフロー
1. **新しい記念日を追加する**
   - `/days`ページへ移動
   - 「新規作成」ボタンをクリック
   - モーダル表示
   - **グループをセレクトボックスで選択** ← **余計な手間**
   - フォーム入力
   - 保存後、モーダル閉じる

2. **記念日を編集する**
   - モーダルで編集
   - グループ変更は... できるのか？できないのか？不明確

---

## ra9の問題点

### 1. 統計ダッシュボードは不要

**問題**:
- 「グループ数」「記念日数」を見る意味がない
- ユーザーが見たいのは記念日そのもの
- ra8にはこの機能はない

**結論**: 削除する

### 2. 記念日を5件に絞る意味がない

**問題**:
- 絞ることで情報が欠落
- モバイルでもスクロールすればいい
- ra8は全て表示している

**結論**: 全件表示に戻す

### 3. Entity一覧とDay一覧を分離する意味がない

**問題**:
- 結局DayにはEntityをJOINする → **クエリコストは同じ**
- 「記念日だけ見たい」というユースケースは存在しない
- データ構造の本質はEntityにDayが属すること

**結論**: Entity中心の一画面に統合

### 4. 記念日作成時にグループを選ばせるのはUX的に悪い

**問題**:
- ra8: Entityカードの「記念日追加」ボタン → 既にグループが決まっている
- ra9: モーダルでグループをセレクトボックスで選択 → 余計な手間
- セレクトボックスが増えるほどモバイルで操作しづらい

**結論**: EntityからDayを追加する流れに戻す

### 5. データ構造とUIの乖離

**問題**:
- データ構造: `days.entity_id` → Day が Entity に属する
- ra8のUI: EntityCard内にDayCardをネスト → データ構造を反映
- ra9のUI: EntityとDayが対等 → データ構造と乖離

**結論**: UIをデータ構造に合わせる

### 6. モーダルUIの問題（モバイル）

**問題**:
- 日付選択時にキーボードが出ると画面が隠れる
- スクロールが必要になる
- フルスクリーンフォームの方が入力しやすい

**結論**: 別ページ遷移に戻す

---

## リファクタリング計画

### Phase 1: ページ構成の変更

#### 削除するページ
- [x] `app/dashboard/page.tsx` - 統計ダッシュボード
- [x] `app/entities/page.tsx` - Entity一覧ページ
- [x] `app/entities/new/page.tsx` - Entity作成ページ
- [x] `app/entities/[id]/page.tsx` - Entity編集ページ
- [x] `app/days/page.tsx` - Day一覧ページ

#### 新規作成するページ

**`/app/page.tsx`** - 一覧ページ（閲覧専用）
- ra8の`Dashboard.tsx`と同等
- EntityごとにカードUI表示
- 各EntityCard内にDaysをネスト表示
- 記念日があるEntityのみ表示
- 操作ボタンなし（閲覧専用）
- Server Component

**`/app/edit/page.tsx`** - 編集ページ
- ra8の`Entities.tsx`と同等
- 全Entityを表示（記念日がなくてもOK）
- 各EntityCardに操作ボタン配置
- Server Component

**`/app/edit/entity/new/page.tsx`** - Entity作成
- フルスクリーンフォーム
- name, descのみ
- 保存後 `/edit` にリダイレクト

**`/app/edit/entity/[id]/page.tsx`** - Entity編集
- フルスクリーンフォーム
- name, desc編集
- 保存後 `/edit` にリダイレクト

**`/app/edit/entity/[entityId]/day/new/page.tsx`** - Day作成
- フルスクリーンフォーム
- Entityは固定（URLから取得）
- react-datepicker使用
- 和暦リアルタイム表示
- 保存後 `/edit` にリダイレクト

**`/app/edit/entity/[entityId]/day/[dayId]/page.tsx`** - Day編集
- フルスクリーンフォーム
- Entityは固定（変更不可）
- react-datepicker使用
- 和暦リアルタイム表示
- 保存後 `/edit` にリダイレクト

### Phase 2: Header改修（モバイル対応）

**`/components/layout/Header.tsx`**
- [x] ナビゲーション: 「一覧」「編集」の2つのみ
- [x] ハンバーガーメニュー実装（`sm:hidden`）
- [x] 日付表示: デスクトップのみ（`hidden md:block`）
- [x] ユーザー情報: ドロップダウンメニュー化

**新規コンポーネント**
- [x] `components/layout/ResponsiveNavLink.tsx` - モバイルナビ用リンク
- [x] `components/layout/Dropdown.tsx` - ユーザーメニュー

### Phase 3: カードコンポーネント作成

**`/components/EntityCard.tsx`**
- [x] ra8と同じデザイン
  - 透過背景（`bg-transparent`）
  - border-top のみ（`border-t border-gray-300`）
  - パディング: `p-2 lg:p-6`
- [x] Entityの名前・説明表示
- [x] 操作ボタンエリア（編集ページのみ）
  - 削除ボタン（ピンク）
  - 編集ボタン（イエロー）
  - Day追加ボタン（スカイブルー）
- [x] Days表示エリア（AnniversaryDayCardのリスト）

**`/components/AnniversaryDayCard.tsx`**
- [x] カウントダウン表示
  - 青とピンクのカラフルデザイン
  - `text-2xl lg:text-3xl font-bold`
- [x] 和暦表示（グレー）
- [x] 年齢表示（経過年数）
- [x] 操作ボタン（編集ページのみ）
  - 削除ボタン（ピンク、小さめ）
  - 編集ボタン（イエロー、小さめ）

### Phase 4: フォームコンポーネント

**`/components/forms/FormField.tsx`**
- [x] ラベル、入力フィールド、エラーメッセージを統合
- [x] ra8の`FormField`を再現

**`/components/forms/FormSuccessMessage.tsx`**
- [x] 保存成功時のメッセージ表示
- [x] 緑背景、3秒後に自動消去

**`/components/forms/DatePickerField.tsx`**
- [x] react-datepicker使用
- [x] インラインカレンダー表示
- [x] 和暦リアルタイム表示
- [x] 年齢自動計算

### Phase 5: Hooks作成

**`/hooks/useConfirmDelete.ts`**
- [x] ブラウザ標準confirm使用
- [x] 削除確認とServer Action呼び出し

### Phase 6: 依存関係追加

```bash
npm install react-datepicker
npm install -D @types/react-datepicker
```

### Phase 7: 削除するファイル

**コンポーネント**
- [x] `components/ui/Modal.tsx`
- [x] `components/ui/ConfirmDialog.tsx`
- [x] `app/entities/EntitiesClient.tsx`
- [x] `app/days/DaysClient.tsx`

---

## レスポンシブデザイン戦略

### モバイルファースト

#### パディング
- モバイル: `p-2` - 画面を有効活用
- デスクトップ: `lg:p-12` - 広々とした表示

#### ハンバーガーメニュー
- `sm:hidden` でモバイル時に表示
- メニュー開閉でナビゲーション表示/非表示

#### 日付表示
- モバイル: 非表示（画面領域を節約）
- デスクトップ: `hidden md:block` で表示

#### ボタン
- モバイル: テキスト付き、大きめ（タップしやすい）
- デスクトップ: アイコン+テキスト

#### カード
- border-t のみ（ra8スタイル）
- 背景なし（透過）
- シンプルでコンパクト

---

## カラースキーム

### ボタン
- **Danger（削除）**: `bg-pink-500 hover:bg-pink-600 text-white`
- **Warning（編集）**: `bg-yellow-500 hover:bg-yellow-600 text-white`
- **Primary（追加）**: `bg-sky-500 hover:bg-sky-600 text-white`

### カウントダウン
- 日数: `text-blue-600 dark:text-blue-400`
- 単位: `text-pink-600 dark:text-pink-400`

### 和暦・年齢
- `text-gray-600 dark:text-gray-400`

---

## Server Actionsの変更

既存のServer Actionsは**ほぼそのまま使用**できます。

### `app/actions/entities.ts`
- 既存の`getEntities()`を拡張
- 記念日があるEntityのみ取得する関数追加
- ra8の`EntitiesService::getEntitiesForPickup()`と同等

```typescript
export async function getEntitiesWithDays() {
  const userId = await getUserId();

  const userEntities = await db.query.entities.findMany({
    where: and(
      eq(entities.userId, userId),
      isNull(entities.deletedAt)
    ),
    with: {
      days: {
        where: isNull(days.deletedAt),
      },
    },
    orderBy: [entities.createdAt],
  });

  // 記念日があるEntityのみ
  return userEntities.filter(entity => entity.days.length > 0);
}
```

### `app/actions/days.ts`
- 変更なし

---

## 期待される改善効果

### モバイル体験
✅ ハンバーガーメニューでナビゲーションがスッキリ
✅ パディング削減で情報量30%アップ
✅ タップ領域拡大で誤操作減少
✅ 日付入力UIでストレス解消（react-datepicker）

### 設計のシンプル化
✅ 不要な統計ダッシュボード削除
✅ EntityとDayの正しい主従関係を反映
✅ 2ページ構成（一覧/編集）で迷わない
✅ データ構造とUIが一致

### パフォーマンス
✅ 不要なデータ変換処理（flatMap）が不要
✅ EntityからDayをeager loadingで効率的に取得
✅ N+1問題なし

### メンテナンス性
✅ ra8の実績ある設計を踏襲
✅ データ構造に忠実なUIでバグが減る
✅ Next.js 15の技術的優位性も保持

---

## 実装スケジュール

### 見積もり工数
大規模なリファクタリングのため、**3-4時間程度**を想定。

### 実装順序
1. 依存関係追加（react-datepicker）
2. Header改修（ハンバーガーメニュー）
3. Hooks作成（useConfirmDelete）
4. フォームコンポーネント作成
5. カードコンポーネント作成
6. ページ作成（`/`, `/edit`, フォームページ群）
7. 既存ファイル削除
8. 動作確認・調整
9. ドキュメント更新

---

## 参考資料

- recordingAnniversaries8リポジトリ
- Laravelプロジェクト: `../recordingAnniversaries8`
- 主要ファイル:
  - `resources/js/Pages/Dashboard.tsx`
  - `resources/js/Pages/Entities.tsx`
  - `resources/js/Components/EntityCard.tsx`
  - `resources/js/Components/AnniversaryDayCard.tsx`
  - `resources/js/Layouts/AuthenticatedLayout.tsx`

---

## まとめ

ra9で追加した「改善」は、実際には不要な複雑化でした。

- ❌ 統計ダッシュボード → 不要
- ❌ Entity/Day独立ページ → データ構造と乖離
- ❌ モーダルフォーム → モバイルで使いづらい
- ❌ グループ選択UI → 余計な手間

ra8のシンプルで実用的な設計に戻すことで、より良いUXを実現します。
