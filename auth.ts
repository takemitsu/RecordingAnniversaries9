import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Passkey from "next-auth/providers/passkey";
import { db } from "@/lib/db";
import { accounts, authenticators, sessions, users } from "@/lib/db/schema";

export const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    authenticatorsTable: authenticators,
  }),
  debug: false, // 本番: false、デバッグ時のみ true
  useSecureCookies: false, // E2Eテスト対応: Cookie名を authjs.session-token に固定
  logger: {
    error(code, ...message) {
      console.error(code, ...message);
    },
    warn() {
      // 警告ログを抑制（experimental-webauthn など）
    },
    debug() {
      // デバッグログを抑制
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // 既存アカウントとの紐付けを許可
    }),
    Passkey,
  ],
  experimental: {
    enableWebAuthn: true,
  },
  callbacks: {
    async signIn({ account }) {
      // Passkey認証時に lastUsedAt を更新
      if (account?.provider === "passkey" && account.providerAccountId) {
        await db
          .update(authenticators)
          .set({ lastUsedAt: new Date() })
          .where(eq(authenticators.credentialID, account.providerAccountId));
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
