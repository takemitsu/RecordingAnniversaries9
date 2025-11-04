"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { anniversaryQueries, collectionQueries } from "@/lib/db/queries";

type AnniversaryFormState = {
  error?: string;
} | null;

export async function createAnniversary(
  _prevState: AnniversaryFormState,
  formData: FormData,
): Promise<AnniversaryFormState> {
  const collectionId = Number(formData.get("collectionId"));

  if (!collectionId) {
    return { error: "グループIDが指定されていません" };
  }

  const userId = await getUserId();

  const collection = await collectionQueries.findById(collectionId, userId);
  if (!collection) {
    return { error: "グループが見つかりません" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const anniversaryDate = formData.get("anniversaryDate") as string;

  if (!name || name.trim().length === 0) {
    return { error: "記念日名を入力してください" };
  }

  if (
    !anniversaryDate ||
    !dayjs(anniversaryDate, "YYYY-MM-DD", true).isValid()
  ) {
    return { error: "有効な日付を入力してください" };
  }

  try {
    await anniversaryQueries.create({
      collectionId,
      name: name.trim(),
      description: description?.trim() || null,
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
  const anniversaryId = Number(formData.get("anniversaryId"));

  if (!anniversaryId) {
    return { error: "記念日IDが指定されていません" };
  }

  const userId = await getUserId();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const anniversaryDate = formData.get("anniversaryDate") as string;

  if (!name || name.trim().length === 0) {
    return { error: "記念日名を入力してください" };
  }

  if (
    anniversaryDate &&
    !dayjs(anniversaryDate, "YYYY-MM-DD", true).isValid()
  ) {
    return { error: "有効な日付を入力してください" };
  }

  try {
    await anniversaryQueries.update(anniversaryId, userId, {
      name: name.trim(),
      description: description?.trim() || null,
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

export async function getAnniversary(anniversaryId: number) {
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
}
