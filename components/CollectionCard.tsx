"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VISIBILITY } from "@/lib/constants";
import type { Anniversary, Collection } from "@/lib/db/schema";
import { AnniversaryCard } from "./AnniversaryCard";

interface CollectionCardProps {
  collection: Collection & { anniversaries: Anniversary[] };
  showActions?: boolean;
  isFirst?: boolean;
  onDelete?: (id: number, name: string) => void;
  onDeleteAnniversary?: (id: number, name: string) => void;
}

export function CollectionCard({
  collection,
  showActions = false,
  isFirst = false,
  onDelete,
  onDeleteAnniversary,
}: CollectionCardProps) {
  const showBorder = showActions || !isFirst;
  return (
    <div
      className={`${showBorder ? "border-t border-gray-300 dark:border-gray-600" : ""} p-2 md:p-6`}
    >
      {/* Collection Header */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        {showActions && collection.isVisible === VISIBILITY.HIDDEN && (
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400 mb-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>一覧に非表示</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        )}
        {collection.name}
      </h3>

      {collection.description && (
        <p
          className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line ${!showActions ? "mb-2" : ""}`}
        >
          {collection.description}
        </p>
      )}

      {/* Action Buttons (編集ページのみ) */}
      {showActions && (
        <div className="flex justify-end gap-2 mt-2 mb-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete?.(collection.id, collection.name)}
            className="whitespace-nowrap"
          >
            削除
          </Button>
          <Link
            href={`/edit/collection/${collection.id}`}
            className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md whitespace-nowrap transition"
          >
            編集
          </Link>
          <Link
            href={`/edit/collection/${collection.id}/anniversary/new`}
            className="px-2 py-1 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md whitespace-nowrap transition"
          >
            記念日追加
          </Link>
        </div>
      )}

      {/* Anniversaries List */}
      {collection.anniversaries.length > 0 ? (
        <div>
          {collection.anniversaries.map((anniversary) => (
            <AnniversaryCard
              key={anniversary.id}
              anniversary={anniversary}
              collectionId={collection.id}
              showActions={showActions}
              onDelete={onDeleteAnniversary}
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
