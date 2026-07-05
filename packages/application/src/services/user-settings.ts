import {
  getUserSettings as findUserSettings,
  upsertUserSettings as saveUserSettings,
} from "../../../db/src/repositories/user-settings"

export async function getUserSettings(userId: string) {
  const row = await findUserSettings(undefined, userId)
  if (row) {
    return { userId: row.userId, preferredCurrency: row.preferredCurrency }
  }
  return { userId, preferredCurrency: "EUR" as const }
}

export async function updateUserSettings(userId: string, preferredCurrency: string) {
  const row = await saveUserSettings(undefined, userId, preferredCurrency)
  if (!row) {
    return { userId, preferredCurrency }
  }
  return { userId: row.userId, preferredCurrency: row.preferredCurrency }
}
