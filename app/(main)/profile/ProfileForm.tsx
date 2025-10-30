"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "next-auth";
import { updateProfile } from "@/app/actions/profile";
import { FormField } from "@/components/forms/FormField";
import { FormSuccessMessage } from "@/components/forms/FormSuccessMessage";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setShowSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await updateProfile(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        router.refresh();
      }
    } catch (err) {
      setError("更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        プロフィール情報
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        アカウントのプロフィール情報を更新します
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="名前"
          name="name"
          type="text"
          defaultValue={user.name || ""}
          required
        />

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">メールアドレス: </span>
          {user.email}
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white rounded-md text-sm transition"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>

          <FormSuccessMessage show={showSuccess} message="保存しました" />
        </div>
      </form>
    </div>
  );
}
