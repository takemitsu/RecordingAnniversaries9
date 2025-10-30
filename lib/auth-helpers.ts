import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * サーバーコンポーネントやServer Actionsで現在のユーザーセッションを取得
 * 未認証の場合はログインページにリダイレクト
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session;
}

/**
 * サーバーコンポーネントやServer Actionsで現在のユーザーセッションを取得
 * 未認証でもリダイレクトしない
 */
export async function getSession() {
  return await auth();
}

/**
 * ユーザーIDを取得
 */
export async function getUserId() {
  const session = await requireAuth();
  return Number(session.user.id);
}
