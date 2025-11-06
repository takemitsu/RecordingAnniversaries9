import { notFound, redirect } from "next/navigation";
import { getCollection } from "@/app/actions/collections";
import { auth } from "@/auth";
import { CollectionForm } from "@/components/forms/CollectionForm";

export default async function EditCollectionPage({
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
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        グループ編集
      </h1>
      <CollectionForm mode="edit" collection={collection} />
    </div>
  );
}
