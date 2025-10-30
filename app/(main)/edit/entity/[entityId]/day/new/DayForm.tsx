"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDay, updateDay } from "@/app/actions/days";
import type { Day } from "@/lib/db/schema";
import { FormField } from "@/components/forms/FormField";
import { FormSuccessMessage } from "@/components/forms/FormSuccessMessage";
import { DatePickerField } from "@/components/forms/DatePickerField";

interface DayFormProps {
  mode: "create" | "edit";
  entityId: number;
  day?: Day;
}

export function DayForm({ mode, entityId, day }: DayFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    day?.annivAt ? new Date(day.annivAt) : null,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result =
        mode === "create"
          ? await createDay(entityId, formData)
          : await updateDay(day!.id, formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/edit");
        }, 1500);
      }
    } catch (err) {
      setError("エラーが発生しました");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {success && (
        <FormSuccessMessage message="保存しました。編集ページに戻ります..." />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="記念日名"
          name="name"
          type="text"
          defaultValue={day?.name}
          required
          error={error}
        />

        <FormField
          label="説明"
          name="desc"
          type="textarea"
          defaultValue={day?.desc ?? ""}
          rows={3}
        />

        <DatePickerField
          label="記念日"
          name="annivAt"
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          required
        />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "保存中..." : mode === "create" ? "作成" : "更新"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/edit")}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
