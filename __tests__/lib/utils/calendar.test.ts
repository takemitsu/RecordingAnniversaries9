import { describe, expect, test, vi } from "vitest";
import type { Anniversary, Holiday } from "@/lib/types/calendar";
import {
  generateCalendarGrid,
  generateYearCalendar,
} from "@/lib/utils/calendar";

describe("generateCalendarGrid", () => {
  const mockHolidays: Holiday[] = [
    { date: "2025-01-01", name: "元日" },
    { date: "2025-01-13", name: "成人の日" },
  ];

  const mockAnniversaries: Anniversary[] = [
    { id: 1, name: "誕生日", anniversaryDate: "2025-01-15" },
    { id: 2, name: "記念日", anniversaryDate: "2025-01-20" },
  ];

  test("2025年1月のカレンダーグリッドを生成する", () => {
    const grid = generateCalendarGrid(2025, 1, [], []);

    // 42日（6週間）のグリッドが生成される
    expect(grid).toHaveLength(42);

    // 最初の日は2024-12-29（日曜日）
    expect(grid[0].date).toBe("2024-12-29");
    expect(grid[0].isSunday).toBe(true);
    expect(grid[0].isCurrentMonth).toBe(false);

    // 1月1日は水曜日（インデックス3）
    expect(grid[3].date).toBe("2025-01-01");
    expect(grid[3].day).toBe(1);
    expect(grid[3].isCurrentMonth).toBe(true);

    // 1月31日
    const jan31 = grid.find((d) => d.date === "2025-01-31");
    expect(jan31?.day).toBe(31);
    expect(jan31?.isCurrentMonth).toBe(true);

    // 最後の日は2月8日（土曜日）
    expect(grid[41].date).toBe("2025-02-08");
    expect(grid[41].isSaturday).toBe(true);
    expect(grid[41].isCurrentMonth).toBe(false);
  });

  test("祝日が正しくマッピングされる", () => {
    const grid = generateCalendarGrid(2025, 1, mockHolidays, []);

    const jan1 = grid.find((d) => d.date === "2025-01-01");
    expect(jan1?.holidays).toHaveLength(1);
    expect(jan1?.holidays[0].name).toBe("元日");

    const jan13 = grid.find((d) => d.date === "2025-01-13");
    expect(jan13?.holidays).toHaveLength(1);
    expect(jan13?.holidays[0].name).toBe("成人の日");
  });

  test("記念日が正しくマッピングされる", () => {
    const grid = generateCalendarGrid(2025, 1, [], mockAnniversaries);

    const jan15 = grid.find((d) => d.date === "2025-01-15");
    expect(jan15?.anniversaries).toHaveLength(1);
    expect(jan15?.anniversaries[0].name).toBe("誕生日");

    const jan20 = grid.find((d) => d.date === "2025-01-20");
    expect(jan20?.anniversaries).toHaveLength(1);
    expect(jan20?.anniversaries[0].name).toBe("記念日");
  });

  test("祝日と記念日が重なる日を正しく処理する", () => {
    const overlappingAnniversaries: Anniversary[] = [
      { id: 1, name: "誕生日", anniversaryDate: "2025-01-01" },
    ];

    const grid = generateCalendarGrid(
      2025,
      1,
      mockHolidays,
      overlappingAnniversaries,
    );

    const jan1 = grid.find((d) => d.date === "2025-01-01");
    expect(jan1?.holidays).toHaveLength(1);
    expect(jan1?.anniversaries).toHaveLength(1);
    expect(jan1?.holidays[0].name).toBe("元日");
    expect(jan1?.anniversaries[0].name).toBe("誕生日");
  });

  test("今日の日付を正しく判定する", () => {
    // システム時刻を2025-01-15に設定
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15)); // 2025年1月15日

    const grid = generateCalendarGrid(2025, 1, [], []);

    const jan15 = grid.find((d) => d.date === "2025-01-15");
    expect(jan15?.isToday).toBe(true);

    const jan14 = grid.find((d) => d.date === "2025-01-14");
    expect(jan14?.isToday).toBe(false);

    vi.useRealTimers();
  });

  test("土曜日と日曜日を正しく判定する", () => {
    const grid = generateCalendarGrid(2025, 1, [], []);

    // 2025-01-04は土曜日
    const jan4 = grid.find((d) => d.date === "2025-01-04");
    expect(jan4?.isSaturday).toBe(true);
    expect(jan4?.isSunday).toBe(false);

    // 2025-01-05は日曜日
    const jan5 = grid.find((d) => d.date === "2025-01-05");
    expect(jan5?.isSunday).toBe(true);
    expect(jan5?.isSaturday).toBe(false);

    // 2025-01-06は月曜日
    const jan6 = grid.find((d) => d.date === "2025-01-06");
    expect(jan6?.isSunday).toBe(false);
    expect(jan6?.isSaturday).toBe(false);
  });

  test("同じ日に複数の祝日がある場合を処理する", () => {
    const multipleHolidays: Holiday[] = [
      { date: "2025-01-01", name: "元日" },
      { date: "2025-01-01", name: "正月" }, // 架空の例
    ];

    const grid = generateCalendarGrid(2025, 1, multipleHolidays, []);

    const jan1 = grid.find((d) => d.date === "2025-01-01");
    expect(jan1?.holidays).toHaveLength(2);
    expect(jan1?.holidays[0].name).toBe("元日");
    expect(jan1?.holidays[1].name).toBe("正月");
  });

  test("同じ日に複数の記念日がある場合を処理する", () => {
    const multipleAnniversaries: Anniversary[] = [
      { id: 1, name: "誕生日", anniversaryDate: "2025-01-15" },
      { id: 2, name: "結婚記念日", anniversaryDate: "2025-01-15" },
    ];

    const grid = generateCalendarGrid(2025, 1, [], multipleAnniversaries);

    const jan15 = grid.find((d) => d.date === "2025-01-15");
    expect(jan15?.anniversaries).toHaveLength(2);
    expect(jan15?.anniversaries[0].name).toBe("誕生日");
    expect(jan15?.anniversaries[1].name).toBe("結婚記念日");
  });

  test("12月のグリッドが正しく生成される", () => {
    const grid = generateCalendarGrid(2025, 12, [], []);

    expect(grid).toHaveLength(42);

    // 12月1日は月曜日（インデックス1）
    const dec1 = grid.find((d) => d.date === "2025-12-01");
    expect(dec1?.day).toBe(1);
    expect(dec1?.isCurrentMonth).toBe(true);

    // 前月の日付が含まれる
    expect(grid[0].date).toBe("2025-11-30");
    expect(grid[0].isSunday).toBe(true);
    expect(grid[0].isCurrentMonth).toBe(false);

    // 翌年の日付が含まれる
    const lastDay = grid[41];
    expect(lastDay.date).toBe("2026-01-10");
    expect(lastDay.isCurrentMonth).toBe(false);
  });

  test("空の祝日・記念日配列でもエラーなく動作する", () => {
    const grid = generateCalendarGrid(2025, 1, [], []);

    expect(grid).toHaveLength(42);
    grid.forEach((day) => {
      expect(day.holidays).toEqual([]);
      expect(day.anniversaries).toEqual([]);
    });
  });

  test("月の境界をまたぐ6週目が正しく生成される", () => {
    // 2025年2月（日曜日始まり、28日まで）
    const grid = generateCalendarGrid(2025, 2, [], []);

    expect(grid).toHaveLength(42);

    // 最初は前月（1月26日、日曜日）
    expect(grid[0].date).toBe("2025-01-26");
    expect(grid[0].isSunday).toBe(true);
    expect(grid[0].isCurrentMonth).toBe(false);

    // 2月28日
    const feb28 = grid.find((d) => d.date === "2025-02-28");
    expect(feb28?.day).toBe(28);
    expect(feb28?.isCurrentMonth).toBe(true);

    // 最後は翌月（3月8日、土曜日）
    expect(grid[41].date).toBe("2025-03-08");
    expect(grid[41].isSaturday).toBe(true);
    expect(grid[41].isCurrentMonth).toBe(false);
  });

  test("うるう年の2月が正しく生成される", () => {
    // 2024年2月（うるう年、29日まで）
    const grid = generateCalendarGrid(2024, 2, [], []);

    expect(grid).toHaveLength(42);

    // 2月29日が存在する
    const feb29 = grid.find((d) => d.date === "2024-02-29");
    expect(feb29?.day).toBe(29);
    expect(feb29?.isCurrentMonth).toBe(true);

    // 2月1日は木曜日（インデックス4）
    const feb1 = grid.find((d) => d.date === "2024-02-01");
    expect(feb1?.day).toBe(1);
    expect(feb1?.isCurrentMonth).toBe(true);
  });

  test("平年の2月が正しく生成される（2月29日なし）", () => {
    // 2025年2月（平年、28日まで）
    const grid = generateCalendarGrid(2025, 2, [], []);

    expect(grid).toHaveLength(42);

    // 2月29日は存在しない
    const feb29 = grid.find((d) => d.date === "2025-02-29");
    expect(feb29).toBeUndefined();

    // 2月28日が存在する
    const feb28 = grid.find((d) => d.date === "2025-02-28");
    expect(feb28?.day).toBe(28);
    expect(feb28?.isCurrentMonth).toBe(true);
  });

  test("月初が日曜日の場合（前月の日付が0個）", () => {
    // 2025年6月1日は日曜日
    const grid = generateCalendarGrid(2025, 6, [], []);

    expect(grid).toHaveLength(42);

    // 最初の日が6月1日（日曜日）
    expect(grid[0].date).toBe("2025-06-01");
    expect(grid[0].day).toBe(1);
    expect(grid[0].isSunday).toBe(true);
    expect(grid[0].isCurrentMonth).toBe(true);

    // 前月の日付は含まれない
    const mayDates = grid.filter((d) => d.date.startsWith("2025-05"));
    expect(mayDates).toHaveLength(0);
  });

  test("月末が土曜日の場合", () => {
    // 2025年8月31日は日曜日、30日は土曜日
    const grid = generateCalendarGrid(2025, 8, [], []);

    expect(grid).toHaveLength(42);

    // 8月30日は土曜日
    const aug30 = grid.find((d) => d.date === "2025-08-30");
    expect(aug30?.day).toBe(30);
    expect(aug30?.isSaturday).toBe(true);
    expect(aug30?.isCurrentMonth).toBe(true);

    // グリッドの最後は翌月の日付
    expect(grid[41].date).toBe("2025-09-06");
    expect(grid[41].isSaturday).toBe(true);
    expect(grid[41].isCurrentMonth).toBe(false);
  });
});

describe("generateYearCalendar", () => {
  const mockHolidays: Holiday[] = [
    { date: "2025-01-01", name: "元日" },
    { date: "2025-05-03", name: "憲法記念日" },
    { date: "2025-12-23", name: "天皇誕生日" },
  ];

  const mockAnniversaries: Anniversary[] = [
    { id: 1, name: "誕生日", anniversaryDate: "2025-06-15" },
  ];

  test("12ヶ月分のカレンダーグリッドを生成する", () => {
    const yearCalendar = generateYearCalendar(2025, [], []);

    expect(yearCalendar).toHaveLength(12);

    // 各月は42日のグリッド
    yearCalendar.forEach((monthGrid) => {
      expect(monthGrid).toHaveLength(42);
    });
  });

  test("各月の最初の日付が正しい", () => {
    const yearCalendar = generateYearCalendar(2025, [], []);

    // 1月1日は水曜日なので、グリッドの4番目（インデックス3）
    const jan1 = yearCalendar[0].find((d) => d.date === "2025-01-01");
    expect(jan1?.day).toBe(1);
    expect(jan1?.isCurrentMonth).toBe(true);

    // 12月1日は月曜日なので、グリッドの2番目（インデックス1）
    const dec1 = yearCalendar[11].find((d) => d.date === "2025-12-01");
    expect(dec1?.day).toBe(1);
    expect(dec1?.isCurrentMonth).toBe(true);
  });

  test("祝日が各月に正しく配置される", () => {
    const yearCalendar = generateYearCalendar(2025, mockHolidays, []);

    // 1月: 元日
    const jan1 = yearCalendar[0].find((d) => d.date === "2025-01-01");
    expect(jan1?.holidays).toHaveLength(1);
    expect(jan1?.holidays[0].name).toBe("元日");

    // 5月: 憲法記念日
    const may3 = yearCalendar[4].find((d) => d.date === "2025-05-03");
    expect(may3?.holidays).toHaveLength(1);
    expect(may3?.holidays[0].name).toBe("憲法記念日");

    // 12月: 天皇誕生日
    const dec23 = yearCalendar[11].find((d) => d.date === "2025-12-23");
    expect(dec23?.holidays).toHaveLength(1);
    expect(dec23?.holidays[0].name).toBe("天皇誕生日");
  });

  test("記念日が各月に正しく配置される", () => {
    const yearCalendar = generateYearCalendar(2025, [], mockAnniversaries);

    // 6月: 誕生日
    const jun15 = yearCalendar[5].find((d) => d.date === "2025-06-15");
    expect(jun15?.anniversaries).toHaveLength(1);
    expect(jun15?.anniversaries[0].name).toBe("誕生日");
  });

  test("空の祝日・記念日配列でもエラーなく動作する", () => {
    const yearCalendar = generateYearCalendar(2025, [], []);

    expect(yearCalendar).toHaveLength(12);
    yearCalendar.forEach((monthGrid) => {
      monthGrid.forEach((day) => {
        expect(day.holidays).toEqual([]);
        expect(day.anniversaries).toEqual([]);
      });
    });
  });
});
