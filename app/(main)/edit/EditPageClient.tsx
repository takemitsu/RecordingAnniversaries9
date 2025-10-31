"use client";

import Link from "next/link";
import { deleteAnniversary } from "@/app/actions/anniversaries";
import type { getCollections } from "@/app/actions/collections";
import { deleteCollection } from "@/app/actions/collections";
import { CollectionCard } from "@/components/CollectionCard";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";

interface EditPageClientProps {
  collections: Awaited<ReturnType<typeof getCollections>>;
}

export function EditPageClient({ collections }: EditPageClientProps) {
  const { confirmDelete } = useConfirmDelete();

  const handleDeleteCollection = async (id: number, name: string) => {
    await confirmDelete(name, async () => {
      return await deleteCollection(id);
    });
  };

  const handleDeleteAnniversary = async (id: number, name: string) => {
    await confirmDelete(name, async () => {
      return await deleteAnniversary(id);
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <Link
          href="/edit/collection/new"
          className="px-3 py-1 text-sm bg-sky-500 hover:bg-sky-600 text-white rounded-md"
        >
          グループ追加
        </Link>
      </div>

      {collections.length > 0 ? (
        <div className="space-y-0">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              showActions={true}
              onDelete={handleDeleteCollection}
              onDeleteAnniversary={handleDeleteAnniversary}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            まだグループがありません
          </p>
          <Link
            href="/edit/collection/new"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            グループを追加しましょう
          </Link>
        </div>
      )}
    </div>
  );
}
