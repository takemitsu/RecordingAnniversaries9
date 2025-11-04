"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Anniversary } from "@/lib/db/schema";
import {
  calculateDiffDays,
  formatCountdown,
} from "@/lib/utils/dateCalculation";
import { getAges, japanDate } from "@/lib/utils/japanDate";

interface AnniversaryCardProps {
  anniversary: Anniversary;
  collectionId: number;
  showActions?: boolean;
  onDelete?: (id: number, name: string) => void;
}

export function AnniversaryCard({
  anniversary,
  collectionId,
  showActions = false,
  onDelete,
}: AnniversaryCardProps) {
  const diffDays = calculateDiffDays(anniversary.anniversaryDate);
  const _countdown = formatCountdown(diffDays);
  const japanDateStr = japanDate(anniversary.anniversaryDate);
  const ages = getAges(anniversary.anniversaryDate);

  return (
    <div className="py-2 pl-2 border-t border-gray-200 dark:border-gray-700">
      {/* Anniversary Name & Countdown (ra8準拠) */}
      <div className="text-base mb-1">
        <span className="text-blue-600 dark:text-blue-400 font-bold">
          {anniversary.name}
        </span>
        <span className="text-sm mx-2 text-gray-600 dark:text-gray-400">
          まで
        </span>
        {diffDays === 0 ? (
          <span className="text-pink-600 dark:text-pink-400 font-bold">
            今日！
          </span>
        ) : (
          <>
            <span className="text-pink-600 dark:text-pink-400 font-bold">
              {diffDays !== null ? Math.abs(diffDays) : "-"}
            </span>
            <span className="text-sm ml-2 text-gray-600 dark:text-gray-400">
              日
            </span>
          </>
        )}
      </div>

      {/* 和暦・年齢 */}
      <div className="text-base text-gray-600 dark:text-gray-200 mb-1">
        <span>{japanDateStr}</span>
        {ages && <span className="ml-3">{ages}</span>}
      </div>

      {anniversary.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {anniversary.description}
        </p>
      )}

      {/* Action Buttons (編集ページのみ) */}
      {showActions && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete?.(anniversary.id, anniversary.name)}
            className="whitespace-nowrap"
          >
            削除
          </Button>
          <Link
            href={`/edit/collection/${collectionId}/anniversary/${anniversary.id}`}
            className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md whitespace-nowrap transition"
          >
            編集
          </Link>
        </div>
      )}
    </div>
  );
}
