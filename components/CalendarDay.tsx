"use client";

import { useState } from "react";
import type { CalendarDay as CalendarDayType } from "@/lib/types/calendar";

type CalendarDayProps = {
  day: CalendarDayType;
};

export function CalendarDay({ day }: CalendarDayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const hasHoliday = day.holidays.length > 0;
  const hasAnniversary = day.anniversaries.length > 0;
  const hasEvents = hasHoliday || hasAnniversary;

  // 日付の背景色・文字色（記念日 > 祝日）
  const getBgColor = () => {
    if (!day.isCurrentMonth) return "bg-gray-100 dark:bg-zinc-900";
    if (hasAnniversary) return "bg-sky-50 dark:bg-sky-950";
    if (hasHoliday) return "bg-red-50 dark:bg-red-950";
    return "bg-white dark:bg-zinc-800";
  };

  // 今日の日付用リング
  const getTodayRing = () => {
    if (!day.isToday) return "";
    return "ring-2 ring-blue-500";
  };

  const getTextColor = () => {
    if (!day.isCurrentMonth) return "text-gray-400 dark:text-gray-600";
    if (day.isToday) return "text-blue-900 dark:text-blue-100 font-bold";
    if (hasHoliday) return "text-red-600 dark:text-red-400";
    if (day.isSunday) return "text-red-600 dark:text-red-400";
    if (day.isSaturday) return "text-blue-600 dark:text-blue-400";
    return "text-gray-900 dark:text-gray-100";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasEvents && setShowTooltip(!showTooltip)}
        onBlur={() => setShowTooltip(false)}
        className={`w-full aspect-square flex flex-col items-center justify-start pt-1 rounded ${getBgColor()} ${getTodayRing()} ${
          hasEvents ? "cursor-pointer hover:ring-2 hover:ring-blue-500" : ""
        } transition`}
      >
        {/* 日付 */}
        <span className={`text-base ${getTextColor()}`}>{day.day}</span>

        {/* ドットインジケーター */}
        {hasEvents && (
          <div className="flex gap-1 mb-1">
            {hasHoliday && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
            {hasAnniversary && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </div>
        )}
      </button>

      {/* ツールチップ */}
      {showTooltip && hasEvents && (
        <div
          className={`absolute z-10 top-full mt-1 p-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg text-xs whitespace-nowrap ${
            day.isSaturday ? "right-0" : "left-0"
          }`}
        >
          {day.holidays.map((holiday) => (
            <div key={holiday.name} className="flex items-center gap-1 mb-1">
              <span>🎌</span>
              <span className="text-gray-900 dark:text-gray-100">
                {holiday.name}
              </span>
            </div>
          ))}
          {day.anniversaries.map((anniversary) => (
            <div key={anniversary.id} className="flex items-center gap-1">
              <span>🎂</span>
              <span className="text-gray-900 dark:text-gray-100">
                {anniversary.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
