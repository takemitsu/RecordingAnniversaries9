import { z } from "zod";

/**
 * Collectionフォーム用のZodスキーマ
 */
export const collectionSchema = z.object({
  name: z.string().trim().min(1, "グループ名を入力してください"),
  description: z.string().trim().nullable().optional(),
  isVisible: z.coerce.number().int(),
});

/**
 * Collectionフォーム入力型（zodから自動推論）
 */
export type CollectionInput = z.infer<typeof collectionSchema>;

/**
 * Collection作成用スキーマ（create時）
 */
export const createCollectionSchema = collectionSchema;

/**
 * Collection更新用スキーマ（update時）
 */
export const updateCollectionSchema = collectionSchema.extend({
  collectionId: z.coerce.number().int().positive(),
});

/**
 * Collection更新入力型
 */
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
