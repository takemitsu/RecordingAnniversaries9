"use client";

import Link from "next/link";
import type { Day } from "@/lib/db/schema";
import { japanDate, getAges } from "@/lib/utils/japanDate";
import {
  calculateDiffDays,
  formatCountdown,
} from "@/lib/utils/dateCalculation";

interface AnniversaryDayCardProps {
  day: Day;
  entityId: number;
  showActions?: boolean;
  onDelete?: (id: number, name: string) => void;
}

export function AnniversaryDayCard({
  day,
  entityId,
  showActions = false,
  onDelete,
}: AnniversaryDayCardProps) {
  const diffDays = calculateDiffDays(day.annivAt);
  const countdown = formatCountdown(diffDays);
  const japanDateStr = japanDate(day.annivAt);
  const ages = getAges(day.annivAt);

  return (
    <div className="py-2 pl-2 border-t border-gray-200 dark:border-gray-700">
      {/* Day Name & Countdown (ra8準拠) */}
      <div className="text-base mb-1">
        <span className="text-blue-600 dark:text-blue-400 font-bold">{day.name}</span>
        <span className="text-sm mx-2 text-gray-600 dark:text-gray-400">まで</span>
        {diffDays === 0 ? (
          <span className="text-pink-600 dark:text-pink-400 font-bold">今日！</span>
        ) : (
          <>
            <span className="text-pink-600 dark:text-pink-400 font-bold">
              {diffDays !== null ? Math.abs(diffDays) : "-"}
            </span>
            <span className="text-sm ml-2 text-gray-600 dark:text-gray-400">日</span>
          </>
        )}
      </div>

      {/* 和暦・年齢 */}
      <div className="text-base text-gray-600 dark:text-gray-200 mb-1">
        <span>{japanDateStr}</span>
        {ages && <span className="ml-3">{ages}</span>}
      </div>

      {day.desc && (
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {day.desc}
        </p>
      )}

      {/* Action Buttons (編集ページのみ) */}
      {showActions && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDelete?.(day.id, day.name)}
            className="px-2 py-1 text-xs bg-pink-500 hover:bg-pink-600 text-white rounded-md whitespace-nowrap"
          >
            削除
          </button>
          <Link
            href={`/edit/entity/${entityId}/day/${day.id}`}
            className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md whitespace-nowrap"
          >
            編集
          </Link>
        </div>
      )}
    </div>
  );
}
