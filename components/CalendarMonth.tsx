import type { CalendarDay } from "@/lib/types/calendar";
import { CalendarDay as CalendarDayComponent } from "./CalendarDay";

type CalendarMonthProps = {
  month: number;
  grid: CalendarDay[];
  showMonthHeader?: boolean;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarMonth({
  month,
  grid,
  showMonthHeader = true,
}: CalendarMonthProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4">
      {/* 月ヘッダー */}
      {showMonthHeader && (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          {month}月
        </h3>
      )}

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={`text-center text-sm font-semibold ${
              index === 0
                ? "text-red-600 dark:text-red-400" // 日曜日
                : index === 6
                  ? "text-blue-600 dark:text-blue-400" // 土曜日
                  : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => (
          <CalendarDayComponent key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}
