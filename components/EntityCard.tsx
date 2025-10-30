"use client";

import Link from "next/link";
import type { Entity, Day } from "@/lib/db/schema";
import { AnniversaryDayCard } from "./AnniversaryDayCard";

interface EntityCardProps {
  entity: Entity & { days: Day[] };
  showActions?: boolean;
  isFirst?: boolean;
  onDelete?: (id: number, name: string) => void;
  onDeleteDay?: (id: number, name: string) => void;
}

export function EntityCard({
  entity,
  showActions = false,
  isFirst = false,
  onDelete,
  onDeleteDay,
}: EntityCardProps) {
  const showBorder = showActions || !isFirst;
  return (
    <div className={`${showBorder ? "border-t border-gray-300 dark:border-gray-600" : ""} p-2 lg:p-6`}>
      {/* Entity Header */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {entity.name}
      </h3>

      {entity.desc && (
        <p className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line ${!showActions ? "mb-2" : ""}`}>
          {entity.desc}
        </p>
      )}

      {/* Action Buttons (編集ページのみ) */}
      {showActions && (
        <div className="flex justify-end gap-2 mt-2 mb-2">
          <button
            type="button"
            onClick={() => onDelete?.(entity.id, entity.name)}
            className="px-2 py-1 text-xs bg-pink-500 hover:bg-pink-600 text-white rounded-md whitespace-nowrap"
          >
            削除
          </button>
          <Link
            href={`/edit/entity/${entity.id}`}
            className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md whitespace-nowrap"
          >
            編集
          </Link>
          <Link
            href={`/edit/entity/${entity.id}/day/new`}
            className="px-2 py-1 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md whitespace-nowrap"
          >
            記念日追加
          </Link>
        </div>
      )}

      {/* Days List */}
      {entity.days.length > 0 ? (
        <div>
          {entity.days.map((day) => (
            <AnniversaryDayCard
              key={day.id}
              day={day}
              entityId={entity.id}
              showActions={showActions}
              onDelete={onDeleteDay}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          記念日はまだありません
        </p>
      )}
    </div>
  );
}
