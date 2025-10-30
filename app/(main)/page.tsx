import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntitiesWithDays } from "@/app/actions/entities";
import { EntityCard } from "@/components/EntityCard";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const entities = await getEntitiesWithDays();

  return (
    <div>
      {entities.length > 0 ? (
        <div className="space-y-0">
          {entities.map((entity, index) => (
            <EntityCard key={entity.id} entity={entity} showActions={false} isFirst={index === 0} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            まだ記念日がありません
          </p>
          <a
            href="/edit"
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            編集ページから記念日を追加しましょう
          </a>
        </div>
      )}
    </div>
  );
}
