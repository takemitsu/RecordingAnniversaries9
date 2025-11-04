import Link from "next/link";
import { redirect } from "next/navigation";
import { getCollectionsWithAnniversaries } from "@/app/actions/collections";
import { auth } from "@/auth";
import { CollectionCard } from "@/components/CollectionCard";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const collections = await getCollectionsWithAnniversaries();

  return (
    <div>
      {collections.length > 0 ? (
        <div className="space-y-0">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              showActions={false}
              isFirst={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            まだ記念日がありません
          </p>
          <Link
            href="/edit"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            編集ページから記念日を追加しましょう
          </Link>
        </div>
      )}
    </div>
  );
}
