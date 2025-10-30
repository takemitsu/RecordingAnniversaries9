"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEntity } from "@/app/actions/entities";
import { EntityForm } from "@/components/forms/EntityForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import type { Day, Entity } from "@/lib/db/schema";

type EntitiesClientProps = {
  entities: (Entity & { days: Day[] })[];
};

export function EntitiesClient({ entities }: EntitiesClientProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntityId, setDeletingEntityId] = useState<number | null>(null);

  function handleSuccess() {
    setIsCreateModalOpen(false);
    setEditingEntity(null);
    router.refresh();
  }

  async function handleDelete(entityId: number) {
    const result = await deleteEntity(entityId);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            グループ管理
          </h1>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            新規グループ作成
          </button>
        </div>

        {entities.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              グループがありません
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              新規グループを作成して記念日を整理しましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {entity.name}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingEntity(entity)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="編集"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="編集"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingEntityId(entity.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="削除"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="削除"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                {entity.desc && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {entity.desc}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    記念日: {entity.days.length}件
                  </span>
                  <Link
                    href={`/entities/${entity.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    詳細 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新規グループ作成"
      >
        <EntityForm
          onSuccess={handleSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 編集モーダル */}
      {editingEntity && (
        <Modal
          isOpen={true}
          onClose={() => setEditingEntity(null)}
          title="グループ編集"
        >
          <EntityForm
            entity={editingEntity}
            onSuccess={handleSuccess}
            onCancel={() => setEditingEntity(null)}
          />
        </Modal>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deletingEntityId !== null}
        onClose={() => setDeletingEntityId(null)}
        onConfirm={() => deletingEntityId && handleDelete(deletingEntityId)}
        title="グループを削除"
        message="このグループを削除してもよろしいですか？グループ内の記念日も削除されます。"
        confirmText="削除"
        cancelText="キャンセル"
        isDestructive
      />
    </>
  );
}
