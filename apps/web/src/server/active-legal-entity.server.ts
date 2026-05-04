import { db } from "@prive-admin-tanstack/db"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { eq } from "drizzle-orm"

/**
 * Server-only helper for reuse inside server function handlers.
 * Lives in `*.server.ts` so TanStack Start excludes it from the client bundle.
 */
export async function readActiveLegalEntityId(userId: string): Promise<string | null> {
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { activeLegalEntityId: true },
  })
  return row?.activeLegalEntityId ?? null
}
