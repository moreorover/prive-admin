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
