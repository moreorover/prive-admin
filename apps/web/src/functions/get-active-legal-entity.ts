import { db } from "@prive-admin-tanstack/db"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"

import { requireAuthMiddleware } from "@/middleware/auth"

export const getActiveLegalEntityId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    const row = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
      columns: { activeLegalEntityId: true },
    })
    return row?.activeLegalEntityId ?? null
  })

/**
 * Server-internal helper for reuse inside other server functions where we
 * already have the session in context. Prefer this over calling the server
 * function endpoint when running on the server.
 */
export async function readActiveLegalEntityId(userId: string): Promise<string | null> {
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { activeLegalEntityId: true },
  })
  return row?.activeLegalEntityId ?? null
}
