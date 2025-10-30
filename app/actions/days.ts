"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { dayQueries } from "@/lib/db/queries";

/**
 * Day作成
 */
export async function createDay(entityId: number, formData: FormData) {
  const _userId = await getUserId();

  const name = formData.get("name") as string;
  const desc = formData.get("desc") as string | null;
  const annivAt = formData.get("annivAt") as string;

  // バリデーション
  if (!name || name.trim().length === 0) {
    return { error: "記念日名を入力してください" };
  }

  if (!annivAt || !dayjs(annivAt, "YYYY-MM-DD", true).isValid()) {
    return { error: "有効な日付を入力してください" };
  }

  try {
    const dayId = await dayQueries.create({
      entityId,
      name: name.trim(),
      desc: desc?.trim() || null,
      annivAt,
    });

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true, dayId };
  } catch (error) {
    console.error("Day creation error:", error);
    return { error: "記念日の作成に失敗しました" };
  }
}

/**
 * Day更新
 */
export async function updateDay(dayId: number, formData: FormData) {
  const userId = await getUserId();

  const name = formData.get("name") as string;
  const desc = formData.get("desc") as string | null;
  const annivAt = formData.get("annivAt") as string;

  // バリデーション
  if (!name || name.trim().length === 0) {
    return { error: "記念日名を入力してください" };
  }

  if (annivAt && !dayjs(annivAt, "YYYY-MM-DD", true).isValid()) {
    return { error: "有効な日付を入力してください" };
  }

  try {
    await dayQueries.update(dayId, userId, {
      name: name.trim(),
      desc: desc?.trim() || null,
      ...(annivAt && { annivAt }),
    });

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Day update error:", error);
    return { error: "記念日の更新に失敗しました" };
  }
}

/**
 * Day削除（ソフトデリート）
 */
export async function deleteDay(dayId: number) {
  const userId = await getUserId();

  try {
    await dayQueries.softDelete(dayId, userId);

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Day deletion error:", error);
    return { error: "記念日の削除に失敗しました" };
  }
}

/**
 * Entityに紐づくDaysを取得
 */
export async function getDaysByEntity(entityId: number) {
  const userId = await getUserId();

  try {
    const days = await dayQueries.findByEntityId(entityId, userId);
    return days;
  } catch (error) {
    console.error("Days fetch error:", error);
    return [];
  }
}

/**
 * 全てのDaysを取得
 */
export async function getAllDays() {
  const userId = await getUserId();

  try {
    const days = await dayQueries.findAllByUserId(userId);
    return days;
  } catch (error) {
    console.error("Days fetch error:", error);
    return [];
  }
}

/**
 * 特定のDayを取得
 */
export async function getDay(dayId: number) {
  const userId = await getUserId();

  try {
    const day = await dayQueries.findById(dayId, userId);

    if (!day) {
      redirect("/edit");
    }

    return day;
  } catch (error) {
    console.error("Day fetch error:", error);
    redirect("/edit");
  }
}
