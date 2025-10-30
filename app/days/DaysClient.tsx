"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DayForm } from "@/components/forms/DayForm";
import { deleteDay } from "@/app/actions/days";
import { calculateDiffDays, formatCountdown } from "@/lib/utils/dateCalculation";
import { japanDate, getAges } from "@/lib/utils/japanDate";
import type { Day } from "@/lib/db/schema";
import { useRouter } from "next/navigation";

type DayWithEntity = Day & {
  entity: {
    id: number;
    name: string;
    desc: string | null;
    status: number;
  };
};

type DaysClientProps = {
  allDays: DayWithEntity[];
  entities: Array<{ id: number; name: string }>;
};

export function DaysClient({ allDays, entities }: DaysClientProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<DayWithEntity | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(
    entities[0]?.id || null
  );

  // 日付計算を追加
  const daysWithCalc = allDays.map((day) => ({
    ...day,
    diffDays: calculateDiffDays(day.annivAt),
    ages: getAges(day.annivAt),
    japaneseDate: japanDate(day.annivAt),
  }));

  function handleOpenModal() {
    if (!selectedEntityId && entities.length > 0) {
      setSelectedEntityId(entities[0].id);
    }
    setIsCreateModalOpen(true);
  }

  function handleSuccess() {
    setIsCreateModalOpen(false);
    setEditingDay(null);
    router.refresh();
  }

  async function handleDelete(dayId: number) {
    const result = await deleteDay(dayId);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            記念日一覧
          </h1>
          {entities.length > 0 ? (
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              新規記念日作成
            </button>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              先にグループを作成してください
            </div>
          )}
        </div>

        {daysWithCalc.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              記念日が登録されていません
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              新規記念日を作成しましょう
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
            {daysWithCalc.map((day) => (
              <div
                key={day.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {day.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {day.entity.name}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => setEditingDay(day)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="編集"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingDayId(day.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="削除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {day.japaneseDate} ({day.annivAt})
                    </p>
                    {day.ages && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {day.ages}
                      </p>
                    )}
                    {day.desc && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {day.desc}
                      </p>
                    )}
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCountdown(day.diffDays)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 作成モーダル */}
      {selectedEntityId && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="新規記念日作成"
        >
          <div className="mb-4">
            <label
              htmlFor="entity-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              グループを選択
            </label>
            <select
              id="entity-select"
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(Number(e.target.value))}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
          <DayForm
            entityId={selectedEntityId}
            onSuccess={handleSuccess}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      )}

      {/* 編集モーダル */}
      {editingDay && (
        <Modal
          isOpen={true}
          onClose={() => setEditingDay(null)}
          title="記念日編集"
        >
          <DayForm
            entityId={editingDay.entity.id}
            day={editingDay}
            onSuccess={handleSuccess}
            onCancel={() => setEditingDay(null)}
          />
        </Modal>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deletingDayId !== null}
        onClose={() => setDeletingDayId(null)}
        onConfirm={() => deletingDayId && handleDelete(deletingDayId)}
        title="記念日を削除"
        message="この記念日を削除してもよろしいですか？"
        confirmText="削除"
        cancelText="キャンセル"
        isDestructive
      />
    </>
  );
}
