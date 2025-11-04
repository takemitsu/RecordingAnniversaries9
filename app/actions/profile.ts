"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

type ProfileFormState = {
  error?: string;
  success?: boolean;
} | null;

/**
 * プロフィール情報を更新
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getUserId();

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    return { error: "名前を入力してください" };
  }

  try {
    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "プロフィールの更新に失敗しました" };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/edit");

  return { success: true };
}
