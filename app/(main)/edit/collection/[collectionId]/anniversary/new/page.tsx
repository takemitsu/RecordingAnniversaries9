import { redirect } from "next/navigation";
import { getCollection } from "@/app/actions/collections";
import { auth } from "@/auth";
import { AnniversaryForm } from "@/components/forms/AnniversaryForm";

export default async function NewAnniversaryPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { collectionId: collectionIdStr } = await params;
  const collectionId = Number(collectionIdStr);
  const collection = await getCollection(collectionId);

  if (!collection) {
    redirect("/edit");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        記念日作成
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        グループ: {collection.name}
      </p>
      <AnniversaryForm mode="create" collectionId={collectionId} />
    </div>
  );
}
