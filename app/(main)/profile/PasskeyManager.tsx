"use client";

import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/webauthn";
import { useState } from "react";
import { deleteAuthenticator } from "@/app/actions/authenticators";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import type { Authenticator } from "@/lib/db/schema";

type PasskeyManagerProps = {
  authenticators: Authenticator[];
};

// timestamp フォーマット (YYYY-MM-DD HH:mm)
function formatTimestamp(date: Date | null | undefined): string {
  if (!date) return "未使用";
  return dayjs(date).format("YYYY-MM-DD HH:mm");
}

export function PasskeyManager({ authenticators }: PasskeyManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { confirmDelete, isPending } = useConfirmDelete();
  const router = useRouter();

  const handleCreatePasskey = async () => {
    try {
      setIsCreating(true);
      await signIn("passkey", { action: "register", redirect: false });
      // 成功したらページをリフレッシュして新しいPasskeyを表示
      router.refresh();
    } catch (error) {
      console.error("Passkey creation error:", error);
      // エラーハンドリングは後のフェーズで実装
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Passkey設定
      </h2>

      {/* Passkey作成ボタン */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleCreatePasskey}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isCreating ? (
            <>
              <span className="animate-spin">⏳</span> Passkey作成中...
            </>
          ) : (
            <>🔑 新しいPasskeyを作成</>
          )}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          このデバイスの生体認証（Touch ID、Face
          IDなど）でログインできるようになります
        </p>
      </div>

      {/* 登録済みPasskey一覧 */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          登録済みPasskey
        </h3>
        {authenticators.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Passkeyが登録されていません
          </p>
        ) : (
          <ul className="space-y-2">
            {authenticators.map((auth) => (
              <li
                key={auth.credentialID}
                className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>{formatTimestamp(auth.createdAt)} 登録</div>
                    <div>{formatTimestamp(auth.lastUsedAt)} 最終使用</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    confirmDelete("このPasskey", () =>
                      deleteAuthenticator(auth.credentialID),
                    )
                  }
                  disabled={isPending}
                  className="flex-shrink-0 px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
