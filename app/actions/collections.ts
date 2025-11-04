"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUserId } from "@/lib/auth-helpers";
import { VISIBILITY } from "@/lib/constants";
import { collectionQueries } from "@/lib/db/queries";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/schemas/collection";

type CollectionFormState = {
  error?: string;
  errors?: Record<string, string[]>;
} | null;

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const userId = await getUserId();

  // FormDataをObjectに変換
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || null,
    isVisible: formData.get("isVisible") || VISIBILITY.VISIBLE,
  };

  // Zodバリデーション
  const result = createCollectionSchema.safeParse(rawData);

  if (!result.success) {
    // フィールドごとのエラーを返す
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { name, description, isVisible } = result.data;

  try {
    await collectionQueries.create({
      userId,
      name,
      description: description || null,
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
  const userId = await getUserId();

  // FormDataをObjectに変換
  const rawData = {
    collectionId: formData.get("collectionId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    isVisible: formData.get("isVisible") || VISIBILITY.VISIBLE,
  };

  // Zodバリデーション
  const result = updateCollectionSchema.safeParse(rawData);

  if (!result.success) {
    // フィールドごとのエラーを返す
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { collectionId, name, description, isVisible } = result.data;

  try {
    await collectionQueries.update(collectionId, userId, {
      name,
      description: description || null,
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

export const getCollections = cache(async () => {
  const userId = await getUserId();

  try {
    const collections = await collectionQueries.findByUserId(userId);
    return collections;
  } catch (error) {
    console.error("Collections fetch error:", error);
    return [];
  }
});

export const getCollectionsWithAnniversaries = cache(async () => {
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
});

export const getCollection = cache(async (collectionId: number) => {
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
});
