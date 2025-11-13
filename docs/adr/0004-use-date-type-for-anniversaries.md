# 0004. 記念日にDATE型を使用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

記念日アプリケーションでは、ユーザーの誕生日や記念日を保存する必要があります。MySQLでは`DATE`型と`DATETIME`型が選択肢として存在します。

要件：
- 記念日は日付のみ（時刻情報は不要）
- 年次繰り返し計算（毎年の誕生日など）
- タイムゾーンの影響を受けない

## Decision（決定）

`anniversaries.anniversary_date`フィールドには**DATE型**を使用します。

### 採用理由

1. **時刻情報不要**: 記念日は「何月何日」のみで、時刻は不要
2. **年次繰り返し計算**: 月日のみで比較が簡単（例: `MONTH(anniversary_date) = 11 AND DAY(anniversary_date) = 1`）
3. **タイムゾーン問題の回避**: DATEはタイムゾーンの影響を受けない
4. **ストレージ効率**: DATETIMEより小さい（3バイト vs 8バイト）
5. **UI/UX**: 日付ピッカーで日付のみ選択すれば良い

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **シンプル**: 日付のみの管理でロジックが単純
- ✅ **タイムゾーン不要**: サーバーとクライアントのタイムゾーン差を考慮不要
- ✅ **計算が容易**: 年次繰り返し、記念日まであと何日の計算がシンプル
- ✅ **ストレージ効率**: データベースサイズの削減
- ✅ **ユーザー体験**: 時刻選択の煩わしさがない

### Negative（ネガティブな影響）

- ⚠️ **時刻情報なし**: イベント時刻が必要な場合は別フィールドが必要
- ⚠️ **タイムスタンプ不可**: 作成/更新日時はcreated_at/updated_atで別途管理

### Implementation Notes（実装メモ）

Drizzle ORMでの定義：
```typescript
anniversaries: mysqlTable("anniversaries", {
  anniversaryDate: date("anniversary_date", { mode: "string" }).notNull(),
})
```

`mode: "string"`を使用することで、JavaScriptでは`"YYYY-MM-DD"`形式の文字列として扱われます。

## References（参考資料）

- [MySQL DATE Type](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
- [Drizzle MySQL Date](https://orm.drizzle.team/docs/column-types/mysql#date)
