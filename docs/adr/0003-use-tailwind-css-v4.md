# 0003. Tailwind CSS v4の採用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

Recording Anniversaries 9では、レスポンシブデザイン、ダークモード対応、モバイルファースト設計が必要でした。

候補として以下を検討：
- Tailwind CSS v4
- CSS Modules
- styled-components
- vanilla-extract

## Decision（決定）

**Tailwind CSS v4**を採用します。

### 採用理由

1. **既存プロジェクトとの一貫性**: ra8でTailwindを使用しており、移行が容易
2. **ユーティリティファースト**: 開発速度が速く、保守性が高い
3. **ダークモード**: `dark:` プレフィックスで簡単に実装
4. **レスポンシブ**: `sm:`, `md:`, `lg:` でブレークポイント管理が直感的
5. **Next.jsエコシステム**: 成熟した統合、最適化されたビルド
6. **v4の新機能**: パフォーマンス改善、CSS変数ベース

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **開発速度**: ユーティリティクラスで迅速にスタイリング
- ✅ **一貫性**: デザインシステムが統一される（spacing, colors等）
- ✅ **保守性**: HTMLを見ればスタイルが分かる、CSSファイル不要
- ✅ **パフォーマンス**: 未使用CSSの自動削除（PurgeCSS内蔵）
- ✅ **ダークモード**: システム設定に自動追従、切り替えも簡単
- ✅ **学習コスト**: チームメンバーがすでに習得済み

### Negative（ネガティブな影響）

- ⚠️ **HTMLの肥大化**: クラス名が長くなりがち
- ⚠️ **カスタムデザイン**: Tailwind外のスタイルは追加設定が必要
- ⚠️ **ビルドサイズ**: 開発時のCSSファイルが大きい（本番では最適化される）

### Design Decisions（デザイン判断）

このプロジェクトでのTailwind使用方針：
- **パディング**: モバイル `p-2`, デスクトップ `lg:p-12`
- **カラーパレット**: Danger（pink-500）, Warning（yellow-500）, Primary（sky-500）
- **レイアウト**: Flexbox中心、Gridは必要最小限

## References（参考資料）

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
