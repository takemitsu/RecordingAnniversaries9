import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDiffDays,
  formatCountdown,
  sortByClosest,
} from "@/lib/utils/dateCalculation";

describe("calculateDiffDays", () => {
  beforeEach(() => {
    // 今日を 2025-11-04 に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("未来日の場合、その日までの日数を返す", () => {
    expect(calculateDiffDays("2025-12-25")).toBe(51); // 51日後
    expect(calculateDiffDays("2025-11-10")).toBe(6); // 6日後
  });

  it("今日の場合、0を返す", () => {
    expect(calculateDiffDays("2025-11-04")).toBe(0); // 今日
  });

  it("過去日で今年の記念日がまだの場合、今年の記念日までの日数", () => {
    expect(calculateDiffDays("2020-12-31")).toBe(57); // 2025-12-31まで
    expect(calculateDiffDays("2020-11-10")).toBe(6); // 2025-11-10まで
  });

  it("過去日で今年の記念日が既に過ぎている場合、来年までの日数", () => {
    expect(calculateDiffDays("2020-01-01")).toBe(58); // 2026-01-01まで
    expect(calculateDiffDays("2020-10-31")).toBe(361); // 2026-10-31まで
  });

  it("今日が記念日の場合（月日が同じ）、0を返す", () => {
    expect(calculateDiffDays("2020-11-04")).toBe(0); // 月日が同じ
    expect(calculateDiffDays("1990-11-04")).toBe(0); // 年は違うが月日が同じ
  });

  it("nullの場合、nullを返す", () => {
    expect(calculateDiffDays(null)).toBeNull();
  });

  it("空文字の場合、nullを返す", () => {
    const result = calculateDiffDays("");
    // 空文字は無効なので、実装的にはnullを返すはず
    // （または無効な日付として処理される）
    expect(result).toBeNull();
  });
});

describe("formatCountdown", () => {
  it("0日の場合、「今日！」を返す", () => {
    const result = formatCountdown(0);
    expect(result).toEqual({ value: "今日", unit: "！" });
  });

  it("1日以上の場合、日数を返す", () => {
    expect(formatCountdown(1)).toEqual({ value: "1", unit: "日" });
    expect(formatCountdown(10)).toEqual({ value: "10", unit: "日" });
    expect(formatCountdown(365)).toEqual({ value: "365", unit: "日" });
  });

  it("nullの場合、「-」を返す", () => {
    const result = formatCountdown(null);
    expect(result).toEqual({ value: "-", unit: "" });
  });
});

describe("sortByClosest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("近い順にソート", () => {
    const anniversaries = [
      { id: 1, diffDays: 57 }, // 57日後
      { id: 2, diffDays: 6 }, // 6日後（最も近い）
      { id: 3, diffDays: 58 }, // 58日後
      { id: 4, diffDays: 0 }, // 今日（最も近い）
    ];

    const sorted = sortByClosest(anniversaries);

    expect(sorted[0].id).toBe(4); // 今日
    expect(sorted[1].id).toBe(2); // 6日後
    expect(sorted[2].id).toBe(1); // 57日後
    expect(sorted[3].id).toBe(3); // 58日後
  });

  it("nullは最後に配置", () => {
    const anniversaries = [
      { id: 1, diffDays: 10 },
      { id: 2, diffDays: null }, // null（最後）
      { id: 3, diffDays: 5 },
    ];

    const sorted = sortByClosest(anniversaries);

    expect(sorted[0].id).toBe(3); // 5日後
    expect(sorted[1].id).toBe(1); // 10日後
    expect(sorted[2].id).toBe(2); // null
  });

  it("複数のnullがある場合", () => {
    const anniversaries = [
      { id: 1, diffDays: null },
      { id: 2, diffDays: 5 },
      { id: 3, diffDays: null },
    ];

    const sorted = sortByClosest(anniversaries);

    expect(sorted[0].id).toBe(2); // 5日後
    // null同士の順序は元の順序を維持
    expect(sorted[1].id).toBe(1);
    expect(sorted[2].id).toBe(3);
  });

  it("空配列の場合", () => {
    const sorted = sortByClosest([]);
    expect(sorted).toEqual([]);
  });
});
