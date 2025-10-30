"use client";

import Link from "next/link";
import type { getEntities } from "@/app/actions/entities";
import { deleteEntity } from "@/app/actions/entities";
import { deleteDay } from "@/app/actions/days";
import { EntityCard } from "@/components/EntityCard";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";

interface EditPageClientProps {
  entities: Awaited<ReturnType<typeof getEntities>>;
}

export function EditPageClient({ entities }: EditPageClientProps) {
  const { confirmDelete } = useConfirmDelete();

  const handleDeleteEntity = async (id: number, name: string) => {
    await confirmDelete(name, async () => {
      await deleteEntity(id);
    });
  };

  const handleDeleteDay = async (id: number, name: string) => {
    await confirmDelete(name, async () => {
      await deleteDay(id);
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Link
          href="/edit/entity/new"
          className="px-3 py-1 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-md"
        >
          グループ追加
        </Link>
      </div>

      {entities.length > 0 ? (
        <div className="space-y-0">
          {entities.map((entity) => (
            <EntityCard
              key={entity.id}
              entity={entity}
              showActions={true}
              onDelete={handleDeleteEntity}
              onDeleteDay={handleDeleteDay}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            まだグループがありません
          </p>
          <Link
            href="/edit/entity/new"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            グループを追加しましょう
          </Link>
        </div>
      )}
    </div>
  );
}
