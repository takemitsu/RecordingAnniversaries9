import dayjs from "dayjs";
import type { Anniversary, CalendarDay, Holiday } from "@/lib/types/calendar";

/**
 * 指定年月のカレンダーグリッドを生成
 * @param year 年
 * @param month 月（1-12）
 * @param holidays 祝日データ
 * @param anniversaries 記念日データ（オプション）
 * @returns カレンダーの日付配列（前月・当月・翌月の日付を含む）
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  holidays: Holiday[],
  anniversaries: Anniversary[] = [],
): CalendarDay[] {
  const firstDay = dayjs(`${year}-${month.toString().padStart(2, "0")}-01`);
  const today = dayjs().format("YYYY-MM-DD");

  // 月初の曜日（0=日曜、6=土曜）
  const startDayOfWeek = firstDay.day();

  // カレンダーグリッドの開始日（月初が日曜日でない場合、前月の日付を含む）
  const startDate = firstDay.subtract(startDayOfWeek, "day");

  // カレンダーグリッドの終了日（翌月の日付を含む、6週分=42日）
  const endDate = startDate.add(41, "day");

  // 祝日・記念日をMapに変換（高速検索用）
  const holidayMap = new Map<string, Holiday[]>();
  for (const holiday of holidays) {
    const existing = holidayMap.get(holiday.date) || [];
    holidayMap.set(holiday.date, [...existing, holiday]);
  }

  // 記念日を月日（MM-DD）でグループ化（年次繰り返し用）
  const anniversaryByMonthDay = new Map<string, Anniversary[]>();
  for (const anniversary of anniversaries) {
    const monthDay = anniversary.anniversaryDate.slice(5); // "MM-DD"
    const existing = anniversaryByMonthDay.get(monthDay) || [];
    anniversaryByMonthDay.set(monthDay, [...existing, anniversary]);
  }

  // カレンダーグリッド生成
  const grid: CalendarDay[] = [];
  let current = startDate;

  while (current.isBefore(endDate) || current.isSame(endDate)) {
    const dateStr = current.format("YYYY-MM-DD");
    const dayOfWeek = current.day();
    const currentMonthDay = dateStr.slice(5); // "MM-DD"

    // その日付に該当する記念日を取得（記念日の年以降のみ）
    const matchingAnniversaries =
      anniversaryByMonthDay.get(currentMonthDay)?.filter((anniversary) => {
        const anniversaryYear = Number.parseInt(
          anniversary.anniversaryDate.slice(0, 4),
          10,
        );
        const currentYear = Number.parseInt(dateStr.slice(0, 4), 10);
        return currentYear >= anniversaryYear;
      }) || [];

    grid.push({
      date: dateStr,
      day: current.date(),
      isCurrentMonth: current.month() + 1 === month,
      isToday: dateStr === today,
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
      holidays: holidayMap.get(dateStr) || [],
      anniversaries: matchingAnniversaries,
    });

    current = current.add(1, "day");
  }

  return grid;
}

/**
 * 年間カレンダーグリッドを生成（12ヶ月分）
 * @param year 年
 * @param holidays 祝日データ
 * @param anniversaries 記念日データ（オプション）
 * @returns 12ヶ月分のカレンダーグリッド配列
 */
export function generateYearCalendar(
  year: number,
  holidays: Holiday[],
  anniversaries: Anniversary[] = [],
): CalendarDay[][] {
  const months: CalendarDay[][] = [];

  for (let month = 1; month <= 12; month++) {
    months.push(generateCalendarGrid(year, month, holidays, anniversaries));
  }

  return months;
}
