"use client";

import type { User } from "next-auth";
import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { FormField } from "@/components/forms/FormField";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        プロフィール情報
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        アカウントのプロフィール情報を更新します
      </p>

      <form action={formAction} className="space-y-4">
        <FormField
          label="名前"
          name="name"
          type="text"
          defaultValue={user.name || ""}
          required
          error={state?.error}
        />

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">メールアドレス: </span>
          {user.email}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                role="img"
                aria-label="読み込み中"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isPending ? "保存中..." : "保存"}
          </button>

          {state?.success && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              保存しました
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
