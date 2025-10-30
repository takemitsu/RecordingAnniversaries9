import { getEntities } from "@/app/actions/entities";
import { requireAuth } from "@/lib/auth-helpers";
import { EntitiesClient } from "./EntitiesClient";

export default async function EntitiesPage() {
  await requireAuth();
  const entities = await getEntities();

  return <EntitiesClient entities={entities} />;
}
