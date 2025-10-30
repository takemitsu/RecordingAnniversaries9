"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth-helpers";
import { entityQueries } from "@/lib/db/queries";

/**
 * Entity作成
 */
export async function createEntity(formData: FormData) {
  const userId = await getUserId();

  const name = formData.get("name") as string;
  const desc = formData.get("desc") as string | null;
  const status = Number(formData.get("status") || 0);

  if (!name || name.trim().length === 0) {
    return { error: "グループ名を入力してください" };
  }

  try {
    const entityId = await entityQueries.create({
      userId,
      name: name.trim(),
      desc: desc?.trim() || null,
      status,
    });

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true, entityId };
  } catch (error) {
    console.error("Entity creation error:", error);
    return { error: "グループの作成に失敗しました" };
  }
}

/**
 * Entity更新
 */
export async function updateEntity(entityId: number, formData: FormData) {
  const userId = await getUserId();

  const name = formData.get("name") as string;
  const desc = formData.get("desc") as string | null;
  const status = Number(formData.get("status") || 0);

  if (!name || name.trim().length === 0) {
    return { error: "グループ名を入力してください" };
  }

  try {
    await entityQueries.update(entityId, userId, {
      name: name.trim(),
      desc: desc?.trim() || null,
      status,
    });

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Entity update error:", error);
    return { error: "グループの更新に失敗しました" };
  }
}

/**
 * Entity削除（ソフトデリート）
 */
export async function deleteEntity(entityId: number) {
  const userId = await getUserId();

  try {
    await entityQueries.softDelete(entityId, userId);

    revalidatePath("/");
    revalidatePath("/edit");

    return { success: true };
  } catch (error) {
    console.error("Entity deletion error:", error);
    return { error: "グループの削除に失敗しました" };
  }
}

/**
 * Entityの一覧を取得
 */
export async function getEntities() {
  const userId = await getUserId();

  try {
    const entities = await entityQueries.findByUserId(userId);
    return entities;
  } catch (error) {
    console.error("Entities fetch error:", error);
    return [];
  }
}

/**
 * 記念日があるEntityのみ取得（一覧ページ用）
 */
export async function getEntitiesWithDays() {
  const userId = await getUserId();

  try {
    const entities = await entityQueries.findByUserId(userId);
    // 記念日があるEntityのみフィルタ
    return entities.filter((entity) => entity.days && entity.days.length > 0);
  } catch (error) {
    console.error("Entities fetch error:", error);
    return [];
  }
}

/**
 * 特定のEntityを取得
 */
export async function getEntity(entityId: number) {
  const userId = await getUserId();

  try {
    const entity = await entityQueries.findById(entityId, userId);

    if (!entity) {
      redirect("/edit");
    }

    return entity;
  } catch (error) {
    console.error("Entity fetch error:", error);
    redirect("/edit");
  }
}
