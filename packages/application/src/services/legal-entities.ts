import {
  getLegalEntity as findLegalEntity,
  listLegalEntities as fetchLegalEntities,
  updateLegalEntity as patchLegalEntity,
} from "@prive-admin-tanstack/db"

import { notFound } from "../errors"

export async function listLegalEntities(input: { pageSize: number; offset: number }) {
  return fetchLegalEntities(undefined, input)
}

export async function getLegalEntity(id: string) {
  const result = await findLegalEntity(undefined, id)
  if (!result) throw notFound("Legal entity not found")
  return result
}

export async function updateLegalEntity(input: {
  id: string
  name: string
  registrationNumber?: string | null
  vatNumber?: string | null
}) {
  const result = await patchLegalEntity(undefined, input)
  if (!result) throw notFound("Legal entity not found")
  return result
}
