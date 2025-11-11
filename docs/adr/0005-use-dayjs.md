# 0005. dayjsの採用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

Recording Anniversaries 9では、日付計算、フォーマット、和暦変換など、日付操作ライブラリが必要でした。

候補として以下を検討：
- dayjs
- date-fns
- Moment.js（非推奨）
- Temporal（Stage 3、未安定）

## Decision（決定）

**dayjs**を採用します。

### 採用理由

1. **既存プロジェクトとの一貫性**: ra8でdayjsを使用しており、移行が容易
2. **軽量**: わずか2KB（gzip圧縮後）、バンドルサイズへの影響が最小
3. **Moment.js互換API**: 使いやすく、学習コストが低い
4. **日本語ロケール**: 日本語対応が標準プラグインで提供
5. **プラグインシステム**: 必要な機能だけ追加可能

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **軽量**: バンドルサイズへの影響が最小（2KB）
- ✅ **開発速度**: Moment.js互換APIで迅速に実装
- ✅ **日本語対応**: ロケールプラグインで日本語表示が簡単
- ✅ **イミュータブル**: オブジェクトがイミュータブルでバグが少ない
- ✅ **メンテナンス**: アクティブに開発されている

### Negative（ネガティブな影響）

- ⚠️ **プラグイン**: 機能追加にプラグインインポートが必要
- ⚠️ **タイムゾーン**: タイムゾーン処理にはプラグインが必要
- ⚠️ **date-fnsとの比較**: Tree-shakingではdate-fnsの方が優れる

### Use Cases（使用例）

このプロジェクトでの主な用途：
- 日付フォーマット（`YYYY-MM-DD`, `YYYY年MM月DD日`）
- 年齢計算（誕生日から現在までの年数）
- カウントダウン/カウントアップ計算
- 和暦変換の補助

### Implementation Notes（実装メモ）

必要なプラグイン：
```typescript
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('ja')
```

## References（参考資料）

- [Day.js Documentation](https://day.js.org/)
- [Day.js Plugins](https://day.js.org/docs/en/plugin/plugin)
