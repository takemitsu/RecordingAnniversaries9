import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { z } from "zod";

dayjs.extend(customParseFormat);

/**
 * Anniversaryフォーム用のZodスキーマ
 */
export const anniversarySchema = z.object({
  name: z.string().trim().min(1, "記念日名を入力してください"),
  description: z.string().trim().nullable().optional(),
  anniversaryDate: z
    .string()
    .min(1, "記念日を入力してください")
    .refine((val) => dayjs(val, "YYYY-MM-DD", true).isValid(), {
      message: "有効な日付を入力してください（YYYY-MM-DD形式）",
    }),
  collectionId: z.coerce.number().int().positive(),
});

/**
 * Anniversaryフォーム入力型（zodから自動推論）
 */
export type AnniversaryInput = z.infer<typeof anniversarySchema>;

/**
 * Anniversary作成用スキーマ（create時）
 */
export const createAnniversarySchema = anniversarySchema;

/**
 * Anniversary更新用スキーマ（update時）
 */
export const updateAnniversarySchema = anniversarySchema
  .extend({
    anniversaryId: z.coerce.number().int().positive(),
  })
  .partial({ anniversaryDate: true });

/**
 * Anniversary更新入力型
 */
export type UpdateAnniversaryInput = z.infer<typeof updateAnniversarySchema>;
