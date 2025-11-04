import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAges, getTodayForHeader, japanDate } from "@/lib/utils/japanDate";

describe("japanDate", () => {
  it("令和を正しく変換", () => {
    expect(japanDate("2019-05-01")).toBe("令和元年5月1日");
    expect(japanDate("2020-01-01")).toBe("令和2年1月1日");
    expect(japanDate("2025-11-04")).toBe("令和7年11月4日");
  });

  it("平成を正しく変換", () => {
    expect(japanDate("1989-01-08")).toBe("平成元年1月8日");
    expect(japanDate("1990-05-15")).toBe("平成2年5月15日");
    expect(japanDate("2019-04-30")).toBe("平成31年4月30日");
  });

  it("昭和を正しく変換", () => {
    expect(japanDate("1926-12-25")).toBe("昭和元年12月25日");
    expect(japanDate("1950-06-10")).toBe("昭和25年6月10日");
    expect(japanDate("1989-01-07")).toBe("昭和64年1月7日");
  });

  it("大正を正しく変換", () => {
    expect(japanDate("1912-07-30")).toBe("大正元年7月30日");
    expect(japanDate("1920-03-15")).toBe("大正9年3月15日");
    expect(japanDate("1926-12-24")).toBe("大正15年12月24日");
  });

  it("明治を正しく変換", () => {
    expect(japanDate("1868-01-25")).toBe("明治元年1月25日");
    expect(japanDate("1900-08-20")).toBe("明治33年8月20日");
  });

  it("無効な日付は空文字", () => {
    expect(japanDate("invalid")).toBe("");
    expect(japanDate("")).toBe("");
    expect(japanDate("2025-1-1")).toBe(""); // 長さが10でない
    // 注: "2025-13-32"はdayjsによってロールオーバーされるため、空文字にはならない
  });

  it("isOnlyWa=trueの場合、年のみ返す", () => {
    expect(japanDate("2025-11-04", true)).toBe("令和7年");
    expect(japanDate("2019-05-01", true)).toBe("令和元年");
    expect(japanDate("1989-01-08", true)).toBe("平成元年");
  });
});

describe("getAges", () => {
  beforeEach(() => {
    // 今日を 2025-11-04 に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("経過年数を正しく計算（5年 → 6年目）", () => {
    expect(getAges("2020-11-04")).toBe("5年（6年目）");
    expect(getAges("2020-01-01")).toBe("5年（6年目）");
    expect(getAges("2024-12-31")).toBe("0年（1年目）");
  });

  it("未来日は空文字", () => {
    expect(getAges("2030-01-01")).toBe("");
    expect(getAges("2026-01-01")).toBe(""); // 来年
    expect(getAges("2025-12-31")).toBe(""); // 今年の年末
  });

  it("今日は0年（1年目）", () => {
    expect(getAges("2025-11-04")).toBe("0年（1年目）");
  });

  it("無効な日付は空文字", () => {
    expect(getAges("invalid")).toBe("");
    expect(getAges("")).toBe("");
    expect(getAges(null)).toBe("");
  });

  it("1年前は1年（2年目）", () => {
    expect(getAges("2024-11-04")).toBe("1年（2年目）");
  });

  it("10年前は10年（11年目）", () => {
    expect(getAges("2015-11-04")).toBe("10年（11年目）");
  });
});

describe("getTodayForHeader", () => {
  beforeEach(() => {
    // 今日を 2025-11-04 14:30 に固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04T14:30:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ヘッダー用の日付フォーマットを返す", () => {
    const result = getTodayForHeader();

    // 例: "2025-11-04 (火) 14:30（令和7年）"
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} \(.+\) \d{2}:\d{2}/);
    expect(result).toMatch(/令和\d+年/);
    expect(result).toContain("2025-11-04");
    expect(result).toContain("14:30");
    expect(result).toContain("令和7年");
  });
});
