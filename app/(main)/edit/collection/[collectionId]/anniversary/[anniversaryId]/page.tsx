import { redirect } from "next/navigation";
import { getAnniversary } from "@/app/actions/anniversaries";
import { getCollection } from "@/app/actions/collections";
import { auth } from "@/auth";
import { AnniversaryForm } from "@/components/forms/AnniversaryForm";

export default async function EditAnniversaryPage({
  params,
}: {
  params: Promise<{ collectionId: string; anniversaryId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { collectionId: collectionIdStr, anniversaryId: anniversaryIdStr } =
    await params;
  const collectionId = Number(collectionIdStr);
  const anniversaryId = Number(anniversaryIdStr);

  const collection = await getCollection(collectionId);
  const anniversary = await getAnniversary(anniversaryId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        記念日編集
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        グループ: {collection.name}
      </p>
      <AnniversaryForm
        mode="edit"
        collectionId={collectionId}
        anniversary={anniversary}
      />
    </div>
  );
}
