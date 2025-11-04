import { describe, expect, it } from "vitest";
import {
  anniversarySchema,
  createAnniversarySchema,
  updateAnniversarySchema,
} from "@/lib/schemas/anniversary";

describe("anniversarySchema", () => {
  it("有効なデータを通す", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      description: "家族の誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("誕生日");
      expect(result.data.description).toBe("家族の誕生日");
      expect(result.data.anniversaryDate).toBe("2020-11-04");
      expect(result.data.collectionId).toBe(1);
    }
  });

  it("名前が空の場合、エラー", () => {
    const result = anniversarySchema.safeParse({
      name: "",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((e) => e.path[0] === "name");
      expect(nameError?.message).toBe("記念日名を入力してください");
    }
  });

  it("日付が空の場合、エラー", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "",
      collectionId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const dateError = result.error.issues.find(
        (e) => e.path[0] === "anniversaryDate",
      );
      expect(dateError?.message).toBe("記念日を入力してください");
    }
  });

  it("無効な日付形式はエラー", () => {
    const invalidDates = [
      "2020-13-01", // 無効な月
      "2020-12-32", // 無効な日
      "2020/11/04", // スラッシュ区切り
      "20-11-04", // 年が2桁
      "invalid",
    ];

    for (const date of invalidDates) {
      const result = anniversarySchema.safeParse({
        name: "誕生日",
        anniversaryDate: date,
        collectionId: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const dateError = result.error.issues.find(
          (e) => e.path[0] === "anniversaryDate",
        );
        expect(dateError?.message).toBe(
          "有効な日付を入力してください（YYYY-MM-DD形式）",
        );
      }
    }
  });

  it("有効な日付形式を通す", () => {
    const validDates = [
      "2020-01-01",
      "2020-12-31",
      "2000-02-29", // 閏年
      "1990-05-15",
    ];

    for (const date of validDates) {
      const result = anniversarySchema.safeParse({
        name: "誕生日",
        anniversaryDate: date,
        collectionId: 1,
      });

      expect(result.success).toBe(true);
    }
  });

  it("閏年でない2月29日はエラー", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2021-02-29", // 2021年は閏年ではない
      collectionId: 1,
    });

    expect(result.success).toBe(false);
  });

  it("descriptionは任意", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
  });

  it("collectionIdは文字列から数値に変換される", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: "123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionId).toBe(123);
      expect(typeof result.data.collectionId).toBe("number");
    }
  });

  it("collectionIdが0以下の場合、エラー", () => {
    const result = anniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe("createAnniversarySchema", () => {
  it("Anniversary作成時に正しくバリデーションする", () => {
    // 正常系
    const validResult = createAnniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });
    expect(validResult.success).toBe(true);

    // 異常系: 日付が無効
    const invalidDateResult = createAnniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "invalid",
      collectionId: 1,
    });
    expect(invalidDateResult.success).toBe(false);

    // 異常系: 名前が空
    const invalidNameResult = createAnniversarySchema.safeParse({
      name: "",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });
    expect(invalidNameResult.success).toBe(false);
  });
});

describe("updateAnniversarySchema", () => {
  it("anniversaryIdが追加されている", () => {
    const result = updateAnniversarySchema.safeParse({
      anniversaryId: 1,
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.anniversaryId).toBe(1);
    }
  });

  it("anniversaryDateはpartialになっている（任意）", () => {
    const result = updateAnniversarySchema.safeParse({
      anniversaryId: 1,
      name: "誕生日（更新）",
      collectionId: 1,
      // anniversaryDateなし
    });

    expect(result.success).toBe(true);
  });

  it("anniversaryIdは文字列から数値に変換される", () => {
    const result = updateAnniversarySchema.safeParse({
      anniversaryId: "456",
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.anniversaryId).toBe(456);
      expect(typeof result.data.anniversaryId).toBe("number");
    }
  });

  it("anniversaryIdが0以下の場合、エラー", () => {
    const result = updateAnniversarySchema.safeParse({
      anniversaryId: 0,
      name: "誕生日",
      collectionId: 1,
    });

    expect(result.success).toBe(false);
  });

  it("anniversaryIdがない場合、エラー", () => {
    const result = updateAnniversarySchema.safeParse({
      name: "誕生日",
      anniversaryDate: "2020-11-04",
      collectionId: 1,
    });

    expect(result.success).toBe(false);
  });
});
