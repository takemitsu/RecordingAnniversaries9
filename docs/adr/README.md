# Architecture Decision Records (ADR)

このディレクトリには、Recording Anniversaries 9プロジェクトの技術的な決定事項（Architecture Decision Records）を記録しています。

## ADRとは

ADRは、プロジェクトで行われた重要な技術的決定の記録です。以下の情報を含みます：

- **なぜ**その決定を行ったのか（Context）
- **何を**決定したのか（Decision）
- **どのような影響**があるのか（Consequences）

## フォーマット

各ADRは以下の構造で記述されています：

```markdown
# [番号]. [タイトル]

**Status**: Accepted/Rejected/Deprecated/Superseded

**Date**: YYYY-MM-DD

## Context（背景）

決定が必要となった背景や課題

## Decision（決定）

採用した技術やアプローチ

## Consequences（結果/影響）

### Positive（ポジティブな影響）
- メリット1
- メリット2

### Negative（ネガティブな影響）
- デメリット1（トレードオフ）
```

## ADR一覧

| 番号 | タイトル | Status | 決定日 |
|-----|---------|--------|--------|
| [0001](0001-use-drizzle-orm.md) | Drizzle ORMの採用 | Accepted | 2024-10-29 |
| [0002](0002-use-authjs-v5.md) | Auth.js v5の採用 | Accepted | 2024-10-29 |
| [0003](0003-use-tailwind-css-v4.md) | Tailwind CSS v4の採用 | Accepted | 2024-10-29 |
| [0004](0004-use-date-type-for-anniversaries.md) | 記念日にDATE型を使用 | Accepted | 2024-10-29 |
| [0005](0005-use-dayjs.md) | dayjsの採用 | Accepted | 2024-10-29 |
| [0006](0006-use-nextjs-16-app-router.md) | Next.js 16 App Routerの採用 | Accepted | 2024-10-29 |

## 参考資料

- [TECH_DECISIONS.md](../reference/TECH_DECISIONS.md) - 技術選定の包括的なドキュメント
- [ADR GitHub Organization](https://adr.github.io/) - ADRのベストプラクティス
