import { describe, expect, it } from "vitest";
import {
  collectionSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/schemas/collection";

describe("collectionSchema", () => {
  it("有効なデータを通す", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      description: "家族の記念日",
      isVisible: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("家族");
      expect(result.data.description).toBe("家族の記念日");
      expect(result.data.isVisible).toBe(1);
    }
  });

  it("isVisibleは文字列から数値に変換される", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      isVisible: "1",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isVisible).toBe(1);
      expect(typeof result.data.isVisible).toBe("number");
    }
  });

  it("名前が空の場合、エラー", () => {
    const result = collectionSchema.safeParse({
      name: "",
      isVisible: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((e) => e.path[0] === "name");
      expect(nameError?.message).toBe("グループ名を入力してください");
    }
  });

  it("名前が空白のみの場合、trim後にエラー", () => {
    const result = collectionSchema.safeParse({
      name: "   ",
      isVisible: 1,
    });

    expect(result.success).toBe(false);
  });

  it("descriptionは任意", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      isVisible: 1,
    });

    expect(result.success).toBe(true);
  });

  it("descriptionはnullでもOK", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      description: null,
      isVisible: 1,
    });

    expect(result.success).toBe(true);
  });

  it("descriptionは空文字でもOK", () => {
    const result = collectionSchema.safeParse({
      name: "家族",
      description: "",
      isVisible: 1,
    });

    expect(result.success).toBe(true);
  });
});

describe("createCollectionSchema", () => {
  it("Collection作成時に正しくバリデーションする", () => {
    // 正常系
    const validResult = createCollectionSchema.safeParse({
      name: "家族",
      description: "家族の記念日",
      isVisible: 1,
    });
    expect(validResult.success).toBe(true);

    // 異常系: 名前が空
    const invalidResult = createCollectionSchema.safeParse({
      name: "",
      isVisible: 1,
    });
    expect(invalidResult.success).toBe(false);
  });
});

describe("updateCollectionSchema", () => {
  it("collectionIdが追加されている", () => {
    const result = updateCollectionSchema.safeParse({
      collectionId: 1,
      name: "家族",
      isVisible: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionId).toBe(1);
    }
  });

  it("collectionIdは文字列から数値に変換される", () => {
    const result = updateCollectionSchema.safeParse({
      collectionId: "123",
      name: "家族",
      isVisible: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionId).toBe(123);
      expect(typeof result.data.collectionId).toBe("number");
    }
  });

  it("collectionIdが0以下の場合、エラー", () => {
    const result = updateCollectionSchema.safeParse({
      collectionId: 0,
      name: "家族",
      isVisible: 1,
    });

    expect(result.success).toBe(false);
  });

  it("collectionIdがない場合、エラー", () => {
    const result = updateCollectionSchema.safeParse({
      name: "家族",
      isVisible: 1,
    });

    expect(result.success).toBe(false);
  });
});
