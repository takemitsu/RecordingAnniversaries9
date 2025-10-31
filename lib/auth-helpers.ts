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
