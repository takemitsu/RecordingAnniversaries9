import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session;
}

export async function getSession() {
  return await auth();
}

export async function getUserId() {
  const session = await requireAuth();
  if (!session.user?.id) {
    redirect("/auth/signin");
  }
  return session.user.id;
}

/**
 * 認証エラー
 * Data Layer での認証失敗時に使用
 */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Data Layer 認証チェック（多層防御）
 * Server Actions → Data Layer の多層防御を実現
 *
 * @param providedUserId - Server Actions から渡された userId
 * @throws {UnauthorizedError} セッションの userId と不一致の場合
 */
export async function verifyUserAccess(providedUserId: string): Promise<void> {
  const authenticatedUserId = await getUserId();
  if (authenticatedUserId !== providedUserId) {
    throw new UnauthorizedError("User ID mismatch");
  }
}
