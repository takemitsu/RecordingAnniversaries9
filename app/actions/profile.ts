"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * プロフィール情報を更新
 */
export async function updateProfile(formData: FormData) {
  const userId = await getUserId();

  try {
    const name = formData.get("name") as string;

    if (!name || name.trim() === "") {
      return { error: "Name is required" };
    }

    await db
      .update(users)
      .set({
        name: name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile" };
  }
}
