import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useConfirmDelete() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const confirmDelete = async (
    itemName: string,
    deleteAction: () => Promise<{ success: boolean } | { error: string }>,
  ) => {
    if (confirm(`「${itemName}」を削除してもよろしいですか？`)) {
      startTransition(async () => {
        try {
          const result = await deleteAction();
          if ("error" in result) {
            alert(result.error);
          } else {
            router.refresh();
          }
        } catch (error) {
          console.error("削除エラー:", error);
          alert("削除に失敗しました。");
        }
      });
    }
  };

  return { confirmDelete, isPending };
}
