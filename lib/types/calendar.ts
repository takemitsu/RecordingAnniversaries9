/**
 * 祝日の型定義
 */
export type Holiday = {
  date: string; // YYYY-MM-DD
  name: string;
};

/**
 * 記念日の型定義（カレンダー表示用）
 */
export type Anniversary = {
  id: number;
  name: string;
  anniversaryDate: string; // YYYY-MM-DD
};

/**
 * カレンダー表示用の日付データ
 */
export type CalendarDay = {
  date: string; // YYYY-MM-DD
  day: number; // 日（1-31）
  isCurrentMonth: boolean; // 当月の日付か
  isToday: boolean; // 今日か
  isSaturday: boolean; // 土曜日か
  isSunday: boolean; // 日曜日か
  holidays: Holiday[]; // その日の祝日
  anniversaries: Anniversary[]; // その日の記念日
};
