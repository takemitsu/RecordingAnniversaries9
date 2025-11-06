"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { authenticators } from "@/lib/db/schema";

export async function getAuthenticators() {
  const userId = await getUserId();

  const userAuthenticators = await db
    .select()
    .from(authenticators)
    .where(eq(authenticators.userId, userId));

  return userAuthenticators;
}

export async function deleteAuthenticator(credentialID: string) {
  const userId = await getUserId();

  await db
    .delete(authenticators)
    .where(
      and(
        eq(authenticators.credentialID, credentialID),
        eq(authenticators.userId, userId),
      ),
    );

  revalidatePath("/profile");
  return { success: true };
}
