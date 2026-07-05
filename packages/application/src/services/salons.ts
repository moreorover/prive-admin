import {
  createSalon as insertSalon,
  getSalon as findSalon,
  listSalons as fetchSalons,
  updateSalon as patchSalon,
} from "../../../db/src/repositories/salons"
import { notFound } from "../errors"

export async function listSalons() {
  return fetchSalons()
}

export async function getSalon(id: string) {
  const result = await findSalon(undefined, id)
  if (!result) throw notFound("Salon not found")
  return result
}

export async function createSalon(input: { name: string; address?: string | null }) {
  return insertSalon(undefined, input)
}

export async function updateSalon(input: { id: string; name: string; address?: string | null }) {
  const result = await patchSalon(undefined, input)
  if (!result) throw notFound("Salon not found")
  return result
}
