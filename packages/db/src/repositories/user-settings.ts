import { eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { userSettings } from "../schema/user-settings"

export async function getUserSettings(database: Db = db, userId: string) {
  return database.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  })
}

export async function upsertUserSettings(database: Db = db, userId: string, preferredCurrency: string) {
  const [row] = await database
    .insert(userSettings)
    .values({ userId, preferredCurrency })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { preferredCurrency },
    })
    .returning()
  return row
}
