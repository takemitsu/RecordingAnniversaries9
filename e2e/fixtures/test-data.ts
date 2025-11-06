import type { Page } from "@playwright/test";
import * as schema from "@/lib/db/schema";
import { getTestDb } from "../helpers/db-seed";

/**
 * テスト用Collectionを作成（DB直接挿入）
 */
export async function createTestCollection(
  name: string,
  options?: {
    description?: string;
    isVisible?: number;
  },
): Promise<number> {
  const db = await getTestDb();

  const result = await db.insert(schema.collections).values({
    userId: "e2e-user-id",
    name,
    description: options?.description || null,
    isVisible: options?.isVisible ?? 1,
  });

  const collectionId = Number(result[0].insertId);
  console.log(`📦 Test collection created: ${name} (ID: ${collectionId})`);

  return collectionId;
}

/**
 * テスト用Anniversaryを作成（DB直接挿入）
 */
export async function createTestAnniversary(
  collectionId: number,
  name: string,
  anniversaryDate: string,
  options?: {
    description?: string;
  },
): Promise<number> {
  const db = await getTestDb();

  const result = await db.insert(schema.anniversaries).values({
    collectionId,
    name,
    anniversaryDate,
    description: options?.description || null,
  });

  const anniversaryId = Number(result[0].insertId);
  console.log(
    `🎉 Test anniversary created: ${name} (ID: ${anniversaryId}, Date: ${anniversaryDate})`,
  );

  return anniversaryId;
}

/**
 * UIを通じてCollectionを作成（フォーム操作）
 */
export async function createCollectionViaUI(
  page: Page,
  name: string,
  options?: {
    description?: string;
    isVisible?: boolean;
  },
) {
  await page.goto("/edit");
  await page.click('a[href="/edit/collection/new"]');

  await page.fill('input[name="name"]', name);

  if (options?.description) {
    await page.fill('textarea[name="description"]', options.description);
  }

  if (options?.isVisible === false) {
    await page.click('input[name="isVisible"][value="0"]');
  }

  await page.click('button[type="submit"]');

  // 編集ページにリダイレクトされるまで待機
  await page.waitForURL("/edit", { timeout: 10000 });

  console.log(`📦 Collection created via UI: ${name}`);
}

/**
 * UIを通じてAnniversaryを作成（フォーム操作）
 */
export async function createAnniversaryViaUI(
  page: Page,
  collectionId: number,
  name: string,
  anniversaryDate: string,
  options?: {
    description?: string;
  },
) {
  await page.goto("/edit");
  await page.click(
    `a[href="/edit/collection/${collectionId}/anniversary/new"]`,
  );

  await page.fill('input[name="name"]', name);
  await page.fill('input[name="anniversaryDate"]', anniversaryDate);

  if (options?.description) {
    await page.fill('textarea[name="description"]', options.description);
  }

  await page.click('button[type="submit"]');

  // 編集ページにリダイレクトされるまで待機
  await page.waitForURL("/edit", { timeout: 10000 });

  console.log(
    `🎉 Anniversary created via UI: ${name} (Date: ${anniversaryDate})`,
  );
}
