import dayjs from "dayjs";
import ja from "dayjs/locale/ja";

dayjs.locale(ja);

function isValidDateString(value: string | null): boolean {
  if (!value || value.length !== 10) return false;
  return dayjs(value, "YYYY-MM-DD").isValid();
}

type Era = {
  readonly at: string;
  readonly gengo: string;
};

const JAPANESE_ERAS: readonly Era[] = [
  { at: "2019-05-01", gengo: "令和" },
  { at: "1989-01-08", gengo: "平成" },
  { at: "1926-12-25", gengo: "昭和" },
  { at: "1912-07-30", gengo: "大正" },
  { at: "1868-01-25", gengo: "明治" },
] as const;

function calculateJapaneseYear(date: dayjs.Dayjs, eraDate: string): string {
  const yearDiff = date.year() - dayjs(eraDate).year() + 1;
  return yearDiff === 1 ? "元" : yearDiff.toString();
}

/**
 * 西暦を和暦に変換
 * @param value YYYY-MM-DD 形式の日付文字列
 * @param isOnlyWa true の場合、年のみ返す（例: 令和5年）
 * @returns 和暦文字列（例: 令和5年10月30日 または 令和5年）
 */
function japanDate(value: string, isOnlyWa = false): string {
  if (!isValidDateString(value)) {
    return "";
  }

  const dt = dayjs(value, "YYYY-MM-DD");
  const gengo = JAPANESE_ERAS.find((era) => dt.diff(era.at, "days", true) >= 0);
  if (!gengo) return "";

  const year = calculateJapaneseYear(dt, gengo.at);

  if (isOnlyWa) {
    return `${gengo.gengo}${year}年`;
  }

  return `${gengo.gengo}${year}年${dt.month() + 1}月${dt.date()}日`;
}

/**
 * 記念日からの経過年数を計算（カウントアップ）
 * @param value YYYY-MM-DD 形式の日付文字列
 * @returns 経過年数の文字列（例: 5年（6年目））、未来日の場合は空文字
 */
function getAges(value: string | null): string {
  if (!isValidDateString(value)) {
    return "";
  }

  const _dt = dayjs(value, "YYYY-MM-DD");

  // 未来日なら表示しない
  if (dayjs().diff(value, "days") < 0) {
    return "";
  }

  const diffYear = dayjs().diff(value, "years");
  return `${diffYear}年（${diffYear + 1}年目）`;
}

/**
 * ヘッダー用の今日の日付を取得
 * @returns 日付文字列（例: 2025-10-30 (木) 14:30（令和7年））
 */
function getTodayForHeader(): string {
  const now = dayjs().locale(ja);
  const dateTimeFormat = now.format("YYYY-MM-DD (dd) HH:mm");
  const waFormat = japanDate(now.format("YYYY-MM-DD"), true);

  return `${dateTimeFormat}（${waFormat}）`;
}

export { japanDate, getAges, getTodayForHeader };
