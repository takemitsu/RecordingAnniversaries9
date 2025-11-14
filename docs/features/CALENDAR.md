# カレンダー機能設計書

**Status**: 実装中（feature/calendarブランチ）

**Date**: 2025-11-14

---

## 概要

記念日＋祝日を可視化するカレンダー機能の追加。

### 背景・目的

現状の課題：
- 一覧表示だけだと「あと何日」は分かるが、**日付感覚が掴みにくい**
- カレンダー的な視覚情報がない

解決策：
- **記念日＋祝日が見える、時刻なしカレンダー**を提供
- 見やすさ最優先のデザイン
- PC/モバイルでの最適な表示

---

## 仕様

### 1. 祝日データ管理

**データソース**: 内閣府公式CSV
https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv

**管理方法**:
- 内閣府CSVをJSON化（Shift-JIS → UTF-8変換）
- `npm run update-holidays`で年1回更新
- `public/holidays.json`（git管理）

**更新フロー**:
```bash
# local/serverそれぞれで実行
npm run update-holidays
```

**ファイル構成**:
```
public/
  └─ holidays.json  # git管理、初回セットアップ不要
scripts/
  └─ update-holidays.js  # CSV取得・変換スクリプト
```

---

### 2. カレンダーコンポーネント（自作）

**コンポーネント設計**:
```typescript
// components/Calendar.tsx
type CalendarProps = {
  holidays: Holiday[];
  anniversaries?: Anniversary[];  // optional
};
```

**技術スタック**:
- dayjs（曜日計算、日付操作）
- Tailwind CSS v4（スタイリング）
- ダークモード対応

**表示形式**:

#### PC版（デスクトップ）
- **2×6グリッド**（年次カレンダー、12ヶ月を一度に表示）
- 年の移動: `◀ 2024 | 2025 | 2026 ▶`
- 今年に戻るボタン: `今年`

#### モバイル版
- **今月・来月の2ヶ月**（縦スクロール）
- 月の移動: `◀ 11月 ▶`
- 今月に戻るボタン: `今月`

**日付セル表示**:
- 祝日: 🎌 アイコン
- 記念日: 🎂 アイコン
- 複数該当: 両方表示（🎌🎂）

**詳細表示**:
- アイコンタップ/クリックでツールチップ表示
- ツールチップ内容:
  ```
  🎌 建国記念の日
  🎂 誕生日
  ```

**デザイン方針**:
- 見やすさ最優先
- 土曜日: 青系文字 or 青系背景
- 日曜・祝日: 赤系文字 or 赤系背景
- 日付サイズ、線の太さなど細かく調整可能

---

### 3. ページ構成

#### `/calendar` - 祝日カレンダー
- **認証**: 未ログインOK（誰でも見られる）
- **表示内容**: 祝日のみ
- **実装**: `<Calendar holidays={holidays} />`

#### `/my-calendar` - 表（カレンダー）
- **認証**: ログイン必要
- **表示内容**: 記念日＋祝日
- **実装**: `<Calendar holidays={holidays} anniversaries={userAnniversaries} />`

#### ナビゲーション

**PC版（ログイン時）**:
- トップバー: 一覧 | 表 | 編集
- ドロップダウンメニュー: カレンダー | 年度一覧 | テーマ切り替え | 設定 | ログアウト

**PC版（未ログイン時）**:
- ドロップダウンメニュー: カレンダー | 年度一覧 | テーマ切り替え | ログイン

**モバイル版（ログイン時）**:
- ハンバーガーメニュー: 一覧 | 表 | カレンダー | 年度一覧 | 編集 | プロフィール | ログアウト

**モバイル版（未ログイン時）**:
- ハンバーガーメニュー: カレンダー | 年度一覧 | ログイン

---

## 技術選定

### dayjs継続（date-fns不採用）

**比較結果**:

| 項目 | dayjs | date-fns |
|------|-------|----------|
| npm downloads/週 | 31M | 36M（ほぼ同等） |
| GitHub stars | 48k | 36k（ほぼ同等） |
| バンドルサイズ | 6KB | 10-15KB |
| メンテナンス | アクティブ | アクティブ |

**dayjs継続の理由**:
1. **バンドルサイズ**: 6KB（date-fnsは10-15KB）
2. **移行コスト**: 3-5時間（テスト含む）に見合うメリットなし
3. **既存実装**: 問題なく動作中
4. **カレンダー自作**: react-day-picker不使用のため、date-fns依存が発生しない

詳細: [ADR 0005: dayjsの採用](../adr/0005-use-dayjs.md)

---

### カレンダー自作（ライブラリ不採用）

**候補ライブラリ**:
- react-day-picker v9（22.2kB、date-fns依存）
- shadcn/ui Calendar（react-day-picker v8ベース）
- Schedule-X（イベントカレンダー向け、不適合）

**自作を選択した理由**:

1. **要件が特殊**
   - 一般的なdate-picker（日付選択）とは用途が違う
   - カレンダー表示が主目的
   - 2×6グリッド（年次カレンダー）は標準的でない

2. **カスタマイズの懸念**
   - PC版レイアウト（2×6グリッド）がライブラリで実現できるか不明
   - 日付セルのカスタマイズ（祝日名・記念日名表示）が制約される可能性
   - モバイル版（縦スクロール）の実装
   - iOS純正風デザインへのカスタマイズが困難な可能性

3. **後で詰まるリスク**
   - ライブラリで実装 → 詰まった → 自作に切り替え
   - 無駄コスト: 3-5時間 + 自作13-20時間 = 合計16-25時間
   - 最初から自作: 8-10時間（アクセシビリティ最小限）

4. **依存ライブラリ不要**
   - date-fns依存がなくなる
   - dayjs統一で軽量（6KB）

**技術的難易度**:
- 高くない（dayjsで曜日計算、Tailwindでレイアウト）
- アクセシビリティは最小限（`role="grid"`程度）

**実装コスト**: 8-10時間（アクセシビリティ最小限）

---

## 実装計画

### Phase 1: 祝日データ取得スクリプト（1-2時間）

**タスク**:
- [ ] `npm run update-holidays` スクリプト作成
- [ ] 内閣府CSV取得・Shift-JIS変換・JSON生成
- [ ] `public/holidays.json` 生成確認

**技術**:
- Node.js fetchでCSV取得
- iconv-lite（Shift-JIS → UTF-8変換）
- csv-parse（CSV → JSON）

**スクリプト実装**:
```javascript
// scripts/update-holidays.js
// 1. 内閣府CSVをfetch
// 2. Shift-JIS → UTF-8変換
// 3. CSV → JSON変換
// 4. public/holidays.json に保存
```

**package.json**:
```json
{
  "scripts": {
    "update-holidays": "node scripts/update-holidays.js"
  }
}
```

---

### Phase 2: カレンダーコンポーネント基本実装（4-5時間）

**タスク**:
- [ ] `components/Calendar.tsx` 作成
- [ ] PC版レイアウト（2×6グリッド）実装
- [ ] モバイル版レイアウト（縦スクロール）実装
- [ ] ツールチップコンポーネント実装

**コンポーネント構成**:
```
components/
  ├─ Calendar.tsx           # メインコンポーネント
  ├─ CalendarMonth.tsx      # 月カレンダー
  └─ CalendarDay.tsx        # 日付セル（ツールチップ内蔵）
```

**実装の流れ**:
1. カレンダーグリッド生成（dayjs使用）
2. レスポンシブレイアウト（PC: grid-cols-2、モバイル: grid-cols-1）
3. 日付セルにアイコン表示
4. ツールチップ実装（onClick/onTap）

---

### Phase 3: ページ追加（2-3時間）

**タスク**:
- [ ] `/holidays` ページ作成（未ログインOK）
- [ ] `/calendar` ページ作成（ログイン必要）
- [ ] ナビゲーションメニューに追加

**ルーティング**:
```
app/
  ├─ (shared)/
  │   └─ calendar/
  │       └─ page.tsx        # 祝日カレンダー（未ログインOK）
  └─ (main)/
      └─ my-calendar/
          └─ page.tsx        # カレンダー（ログイン必要）
```

**実装**:
```typescript
// app/(shared)/calendar/page.tsx
import { Calendar } from "@/components/Calendar";
import holidays from "@/public/holidays.json";

export default function HolidaysPage() {
  return <Calendar holidays={holidays} />;
}
```

```typescript
// app/(main)/my-calendar/page.tsx
import { Calendar } from "@/components/Calendar";
import holidays from "@/public/holidays.json";
import { getAnniversaries } from "@/app/actions/anniversaries";

export default async function MyCalendarPage() {
  const anniversaries = await getAnniversaries();
  return <Calendar holidays={holidays} anniversaries={anniversaries} />;
}
```

---

### Phase 4: 統合・調整（1-2時間）

**タスク**:
- [ ] デザイン調整（見やすさ最優先、土日色分け）
- [ ] ダークモード対応確認
- [ ] テスト実行・デバッグ

**デザイン調整ポイント**:
- 日付サイズ（フォントサイズ、セルサイズ）
- 線の太さ（border）
- 土曜日: 青系（text-blue-600など）
- 日曜・祝日: 赤系（text-red-600など）
- アイコンサイズ

**ダークモード**:
- 背景: `dark:bg-zinc-800`
- テキスト: `dark:text-white`
- ボーダー: `dark:border-gray-600`

---

## 工数見積もり

| Phase | 内容 | 工数 |
|-------|------|------|
| Phase 1 | 祝日データ取得スクリプト | 1-2h |
| Phase 2 | カレンダーコンポーネント基本実装 | 4-5h |
| Phase 3 | ページ追加 | 2-3h |
| Phase 4 | 統合・調整 | 1-2h |
| **合計** | | **8-12h** |

---

## 参考資料

- [内閣府 国民の祝日](https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html)
- [内閣府 祝日CSV](https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv)
- [ADR 0005: dayjsの採用](../adr/0005-use-dayjs.md)
- [TODO.md](../reference/TODO.md)

---

**ドキュメント作成日**: 2025-11-14
**最終更新日**: 2025-11-14
