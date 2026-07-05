import {
  createSalon as insertSalon,
  getSalon as findSalon,
  listSalons as fetchSalons,
  updateSalon as patchSalon,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

export async function listSalons() {
  return fetchSalons()
}

export async function getSalon(id: string) {
  const result = await findSalon(undefined, id)
  if (!result) throw notFound("Salon not found")
  return result
}

export async function createSalon(input: { name: string; address?: string | null }) {
  let result
  try {
    result = await insertSalon(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create salon", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create salon")
  }

  return result
}

export async function updateSalon(input: { id: string; name: string; address?: string | null }) {
  let result
  try {
    result = await patchSalon(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update salon", error)
  }

  if (!result) throw notFound("Salon not found")
  return result
}
