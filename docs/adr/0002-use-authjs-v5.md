# 0002. Auth.js v5の採用

**Status**: Accepted

**Date**: 2024-10-29

## Context（背景）

Recording Anniversaries 9では、Google OAuthとPasskey（WebAuthn）認証を実装する必要がありました。Next.js 16 App Routerとの統合が必要です。

候補として以下を検討：
- Auth.js v5（NextAuth.js v5）
- Better Auth
- Clerk
- 自前実装

## Decision（決定）

**Auth.js v5**を採用します。

### 採用理由

1. **Next.js公式統合**: Next.js App Routerとの統合が公式サポート
2. **Google OAuth**: 実装が簡単で、ドキュメントが充実
3. **WebAuthn対応**: Passkey認証が公式サポートされている
4. **Database strategy**: セッションをMySQLで管理可能
5. **Drizzle統合**: 公式Drizzleアダプターが提供されている
6. **移行パス**: Laravel Socialiteからの移行が明確

## Consequences（結果/影響）

### Positive（ポジティブな影響）

- ✅ **実績**: Next.jsエコシステムで広く使用されている
- ✅ **柔軟性**: 複数プロバイダー（Google, Passkey）を統合可能
- ✅ **セキュリティ**: CSRF保護、セキュアCookie、セッション管理が組み込み
- ✅ **Database strategy**: MySQLでセッション管理、スケーラブル
- ✅ **開発速度**: ボイラープレートが少なく、迅速に実装可能

### Negative（ネガティブな影響）

- ⚠️ **ドキュメント**: v5はベータ版で、ドキュメントが断片的
- ⚠️ **型定義**: TypeScript型定義が完全でない部分がある
- ⚠️ **バージョン**: ベータ版のため、破壊的変更の可能性

### Trade-offs（トレードオフ）

v5のベータ版リスクを受け入れる代わりに、Next.js 16との最良の統合を獲得しました。Clerkのような商用サービスと比べて、コストを抑えられます。

### Migration Notes（移行メモ）

ra8（Laravel）からの移行時：
- セッションは再ログイン必要
- Passkeyは再登録必要
- Google OAuthの認証情報は再利用可能（リダイレクトURI追加のみ）

## References（参考資料）

- [Auth.js Documentation](https://authjs.dev/)
- [Next.js Integration Guide](https://authjs.dev/getting-started/installation?framework=next.js)
- [WebAuthn Provider](https://authjs.dev/getting-started/providers/webauthn)
