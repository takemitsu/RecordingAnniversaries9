"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getUserId } from "@/lib/auth-helpers";
import { anniversaryQueries, collectionQueries } from "@/lib/db/queries";
import {
  createAnniversarySchema,
  updateAnniversarySchema,
} from "@/lib/schemas/anniversary";

type AnniversaryFormState = {
  error?: string;
  errors?: Record<string, string[]>;
} | null;

export async function createAnniversary(
  _prevState: AnniversaryFormState,
  formData: FormData,
): Promise<AnniversaryFormState> {
  const userId = await getUserId();

  // FormDataをObjectに変換
  const rawData = {
    collectionId: formData.get("collectionId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    anniversaryDate: formData.get("anniversaryDate"),
  };

  // Zodバリデーション
  const result = createAnniversarySchema.safeParse(rawData);

  if (!result.success) {
    // フィールドごとのエラーを返す
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { collectionId, name, description, anniversaryDate } = result.data;

  // Collectionの存在確認
  const collection = await collectionQueries.findById(collectionId, userId);
  if (!collection) {
    return { error: "グループが見つかりません" };
  }

  try {
    await anniversaryQueries.create({
      collectionId,
      name,
      description: description || null,
      anniversaryDate,
    });
  } catch (error) {
    console.error("Anniversary creation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return { error: "グループが見つかりません" };
      }
      if (error.message.includes("Duplicate entry")) {
        return { error: "同じ名前の記念日が既に存在します" };
      }
    }

    return { error: "記念日の作成に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/");
  revalidatePath("/edit");
  redirect("/edit");
}

export async function updateAnniversary(
  _prevState: AnniversaryFormState,
  formData: FormData,
): Promise<AnniversaryFormState> {
  const userId = await getUserId();

  // FormDataをObjectに変換
  const rawData = {
    anniversaryId: formData.get("anniversaryId"),
    collectionId: formData.get("collectionId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    anniversaryDate: formData.get("anniversaryDate") || undefined,
  };

  // Zodバリデーション
  const result = updateAnniversarySchema.safeParse(rawData);

  if (!result.success) {
    // フィールドごとのエラーを返す
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { anniversaryId, name, description, anniversaryDate } = result.data;

  try {
    await anniversaryQueries.update(anniversaryId, userId, {
      name,
      description: description || null,
      ...(anniversaryDate && { anniversaryDate }),
    });
  } catch (error) {
    console.error("Anniversary update error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Duplicate entry")) {
        return { error: "同じ名前の記念日が既に存在します" };
      }
    }

    return { error: "記念日の更新に失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/");
  revalidatePath("/edit");
  redirect("/edit");
}

export async function deleteAnniversary(anniversaryId: number) {
  const userId = await getUserId();

  try {
    await anniversaryQueries.delete(anniversaryId, userId);

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Anniversary deletion error:", error);
    return { error: "記念日の削除に失敗しました。もう一度お試しください。" };
  }
}

export const getAnniversary = cache(async (anniversaryId: number) => {
  const userId = await getUserId();

  try {
    const anniversary = await anniversaryQueries.findById(
      anniversaryId,
      userId,
    );

    if (!anniversary) {
      redirect("/edit");
    }

    return anniversary;
  } catch (error) {
    console.error("Anniversary fetch error:", error);
    redirect("/edit");
  }
});
