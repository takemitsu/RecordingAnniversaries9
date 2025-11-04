"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { VISIBILITY } from "@/lib/constants";
import { collectionQueries } from "@/lib/db/queries";

type CollectionFormState = {
  error?: string;
} | null;

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const userId = await getUserId();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const isVisible = Number(formData.get("isVisible") || 0);

  if (!name || name.trim().length === 0) {
    return { error: "グループ名を入力してください" };
  }

  try {
    await collectionQueries.create({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      isVisible,
    });
  } catch (error) {
    console.error("Collection creation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Duplicate entry")) {
        return { error: "同じ名前のグループが既に存在します" };
      }
      if (error.message.includes("Foreign key constraint")) {
        return { error: "ユーザー情報が見つかりません" };
      }
    }

    return { error: "グループの作成に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/");
  revalidatePath("/edit");
  redirect("/edit");
}

export async function updateCollection(
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const collectionId = Number(formData.get("collectionId"));

  if (!collectionId) {
    return { error: "グループIDが指定されていません" };
  }

  const userId = await getUserId();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const isVisible = Number(formData.get("isVisible") || 0);

  if (!name || name.trim().length === 0) {
    return { error: "グループ名を入力してください" };
  }

  try {
    await collectionQueries.update(collectionId, userId, {
      name: name.trim(),
      description: description?.trim() || null,
      isVisible,
    });
  } catch (error) {
    console.error("Collection update error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Duplicate entry")) {
        return { error: "同じ名前のグループが既に存在します" };
      }
    }

    return { error: "グループの更新に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/");
  revalidatePath("/edit");
  redirect("/edit");
}

export async function deleteCollection(collectionId: number) {
  const userId = await getUserId();

  try {
    await collectionQueries.delete(collectionId, userId);

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Collection deletion error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return { error: "このグループには記念日が含まれています" };
      }
    }

    return { error: "グループの削除に失敗しました。もう一度お試しください。" };
  }
}

export async function getCollections() {
  const userId = await getUserId();

  try {
    const collections = await collectionQueries.findByUserId(userId);
    return collections;
  } catch (error) {
    console.error("Collections fetch error:", error);
    return [];
  }
}

export async function getCollectionsWithAnniversaries() {
  const userId = await getUserId();

  try {
    const collections = await collectionQueries.findByUserId(userId);
    return collections.filter(
      (collection) =>
        collection.anniversaries &&
        collection.anniversaries.length > 0 &&
        collection.isVisible === VISIBILITY.VISIBLE,
    );
  } catch (error) {
    console.error("Collections fetch error:", error);
    return [];
  }
}

export async function getCollection(collectionId: number) {
  const userId = await getUserId();

  try {
    const collection = await collectionQueries.findById(collectionId, userId);

    if (!collection) {
      redirect("/edit");
    }

    return collection;
  } catch (error) {
    console.error("Collection fetch error:", error);
    redirect("/edit");
  }
}
