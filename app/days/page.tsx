import { getAllDays } from "@/app/actions/days";
import { getEntities } from "@/app/actions/entities";
import { requireAuth } from "@/lib/auth-helpers";
import { DaysClient } from "./DaysClient";

export default async function DaysPage() {
  await requireAuth();
  const allDays = await getAllDays();
  const entities = await getEntities();

  // entitiesを簡略化
  const simplifiedEntities = entities.map((e) => ({
    id: e.id,
    name: e.name,
  }));

  return <DaysClient allDays={allDays} entities={simplifiedEntities} />;
}
