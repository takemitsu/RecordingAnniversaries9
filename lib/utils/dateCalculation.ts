import dayjs from "dayjs";

/**
 * 記念日から今日までの日数を計算（カウントダウン）
 * 年次繰り返しに対応
 *
 * ロジック:
 * 1. 未来日の場合: その日までの日数を返す
 * 2. 今日が記念日の場合（月日が同じ）: 0 を返す
 * 3. 過去日の場合:
 *    - 今年の記念日がまだ来ていない → 今年の記念日までの日数
 *    - 今年の記念日は既に過ぎている → 来年の記念日までの日数
 *
 * @param anniversaryDate Y-m-d 形式の日付文字列
 * @returns 日数（null の場合は記念日が設定されていない）
 */
export function calculateDiffDays(
  anniversaryDate: string | null,
): number | null {
  if (!anniversaryDate) {
    return null;
  }

  const anniversaryDateTime = dayjs(anniversaryDate, "YYYY-MM-DD").startOf(
    "day",
  );
  const now = dayjs().startOf("day");

  // 未来日の場合
  if (anniversaryDateTime.isAfter(now) || anniversaryDateTime.isSame(now)) {
    return Math.abs(anniversaryDateTime.diff(now, "days"));
  }

  // 今日が記念日の場合（月日が同じ）
  if (
    anniversaryDateTime.month() === now.month() &&
    anniversaryDateTime.date() === now.date()
  ) {
    return 0;
  }

  // 過去日の場合、今年の記念日を計算
  const thisYearAnniversary = anniversaryDateTime.year(now.year());

  if (thisYearAnniversary.isAfter(now)) {
    // 今年の記念日がまだ来ていない
    return Math.abs(thisYearAnniversary.diff(now, "days"));
  }

  // 今年の記念日は既に過ぎているので、来年の記念日までの日数
  const nextYearAnniversary = thisYearAnniversary.add(1, "year");

  return Math.abs(nextYearAnniversary.diff(now, "days"));
}

/**
 * カウントダウン日数を人間が読みやすい形式にフォーマット
 * @param days 日数
 * @returns フォーマットされたオブジェクト（value と unit に分割）
 */
export function formatCountdown(days: number | null): {
  value: string;
  unit: string;
} {
  if (days === null) {
    return { value: "-", unit: "" };
  }

  if (days === 0) {
    return { value: "今日", unit: "！" };
  }

  return { value: `あと ${days}`, unit: "日" };
}

/**
 * 記念日情報を含む拡張型
 */
export type AnniversaryWithCalculation = {
  id: number;
  name: string;
  desc: string | null;
  annivAt: string;
  diffDays: number | null;
  ages: string;
  japaneseDate: string;
};

/**
 * 記念日の一覧をソート（近い順）
 * @param anniversaries 記念日の配列
 * @returns ソートされた配列
 */
export function sortByClosest<T extends { diffDays: number | null }>(
  anniversaries: T[],
): T[] {
  return [...anniversaries].sort((a, b) => {
    if (a.diffDays === null) return 1;
    if (b.diffDays === null) return -1;
    return a.diffDays - b.diffDays;
  });
}
