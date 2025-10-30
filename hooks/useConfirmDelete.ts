import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useConfirmDelete() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const confirmDelete = async (
    itemName: string,
    deleteAction: () => Promise<void>,
  ) => {
    if (confirm(`「${itemName}」を削除してもよろしいですか？`)) {
      startTransition(async () => {
        try {
          await deleteAction();
          router.refresh();
        } catch (error) {
          console.error("削除エラー:", error);
          alert("削除に失敗しました。");
        }
      });
    }
  };

  return { confirmDelete, isPending };
}
