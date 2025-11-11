# 0006. Next.js 16 App Routerの採用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

Recording Anniversaries 9では、React 19とNext.js 16を使用した最新のフルスタックアプリケーションを構築しています。

候補として以下を検討：
- Next.js 16 App Router（React Server Components）
- Next.js 14 Pages Router
- Remix
- 独自React SPA + Express API

## Decision（決定）

**Next.js 16 App Router**を採用します。

### 採用理由

1. **React Server Components**: サーバーサイドレンダリングの新標準
2. **Server Actions**: API Routesより簡潔、型安全な実装
3. **Turbopack**: 開発時のビルド速度が劇的に向上
4. **React 19統合**: useActionStateなど最新機能をサポート
5. **ストリーミングSSR**: Suspenseによる段階的レンダリング
6. **ファイルベースルーティング**: 直感的なルーティング構造

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **パフォーマンス**: RSCによりクライアントバンドルサイズが削減
- ✅ **開発体験**: Server Actionsで型安全なフォーム処理
- ✅ **SEO**: サーバーレンダリングでSEO最適化
- ✅ **コロケーション**: ルーティングとコンポーネントが同じディレクトリ
- ✅ **キャッシング**: React cacheによる自動最適化
- ✅ **型安全性**: paramsとsearchParamsが型安全

### Negative（ネガティブな影響）

- ⚠️ **学習曲線**: RSCとServer Actionsは新しい概念
- ⚠️ **移行コスト**: Pages Routerからの移行は手間がかかる
- ⚠️ **エコシステム**: 一部のライブラリがRSC未対応
- ⚠️ **デバッグ**: サーバー/クライアント境界のデバッグが難しい

### Next.js 16 特有の注意点

```typescript
// params/searchParamsは必ずawait
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}
```

### Architecture Decisions（アーキテクチャ判断）

- **ルーティング**: ファイルベース、グループルーティング`(main)`使用
- **データ取得**: Server Componentsで直接DBアクセス
- **フォーム処理**: Server Actions + useActionState
- **認証**: middleware.tsでルートガード
- **キャッシング**: React cache()でデータキャッシュ

## References（参考資料）

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
