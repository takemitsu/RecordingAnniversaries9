# 0001. Drizzle ORMの採用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

Recording Anniversaries 9では、TypeScriptとNext.js 16を使用したフルスタックアプリケーションを構築しています。MySQLデータベースとの統合に、型安全で効率的なORMが必要でした。

候補として以下を検討：
- Drizzle ORM
- Prisma
- TypeORM

## Decision（決定）

**Drizzle ORM**を採用します。

### 採用理由

1. **TypeScript ファースト**: 完全な型安全性を提供
2. **軽量**: Prismaより軽量で、ランタイムオーバーヘッドが少ない
3. **SQL に近い構文**: SQLの知識を活かせる、学習コストが低い
4. **Next.js 16 との相性**: App RouterやServer Actionsとの統合が容易
5. **Auth.js 統合**: Drizzle アダプターが公式提供されている
6. **マイグレーション**: drizzle-kitで型安全なマイグレーション生成が可能

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **型安全性**: コンパイル時にSQLクエリの型エラーを検出
- ✅ **パフォーマンス**: 軽量で高速、ランタイムオーバーヘッド最小
- ✅ **開発体験**: SQLに近い構文で直感的、IntelliSenseが強力
- ✅ **柔軟性**: 複雑なクエリも記述可能、生SQLも使える
- ✅ **Auth.js統合**: 公式アダプターでセッション管理がスムーズ

### Negative（ネガティブな影響）

- ⚠️ **エコシステム**: Prismaと比べるとエコシステムが小さい
- ⚠️ **GUI**: Prisma Studioのようなビジュアルツールがない（drizzle-kit studioは提供されている）
- ⚠️ **学習曲線**: Prismaより学習リソースが少ない

### Trade-offs（トレードオフ）

Prismaの豊富なエコシステムとビジュアルツールを諦める代わりに、軽量性とSQL直感性を獲得しました。このプロジェクトの規模とチームのSQL知識を考慮すると、適切な選択です。

## References（参考資料）

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle vs Prisma Comparison](https://orm.drizzle.team/docs/comparison)
- [Auth.js Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
