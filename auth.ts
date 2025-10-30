import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Adapter } from "next-auth/adapters";
import { db } from "@/lib/db";
import { users, accounts, authSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Drizzle Adapterのベース
const drizzleAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: authSessions,
});

// カスタムアダプター: AUTO_INCREMENT対応
// Auth.jsはデフォルトでUUIDを生成するが、既存DBはbigint AUTO_INCREMENTなので
// createUser時にidを削除してMySQLのAUTO_INCREMENTを有効化する
const customAdapter: Adapter = {
  ...drizzleAdapter,
  createUser: async (data) => {
    // idフィールドを削除してAUTO_INCREMENTを有効化
    const { id, ...userDataWithoutId } = data;

    // INSERT実行
    const result = await db.insert(users).values({
      name: userDataWithoutId.name,
      email: userDataWithoutId.email,
      emailVerifiedAt: userDataWithoutId.emailVerified || null,
    });

    // 生成されたIDで新規ユーザーを取得
    const insertId = Number(result[0].insertId);
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, insertId))
      .limit(1);

    // Auth.jsが期待する形式で返す（idは文字列）
    return {
      id: String(newUser.id),
      name: newUser.name,
      email: newUser.email,
      emailVerified: newUser.emailVerifiedAt,
      image: null,
    };
  },
};

// Auth.js v5 設定
export const authConfig = {
  adapter: customAdapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // 既存アカウントとの紐付けを許可
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // セッションにユーザーIDを追加
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
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
