import {
  getLegalEntity as findLegalEntity,
  listLegalEntities as fetchLegalEntities,
  updateLegalEntity as patchLegalEntity,
} from "../../../db/src/repositories/legal-entities"
import { notFound } from "../errors"

export async function listLegalEntities() {
  return fetchLegalEntities()
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
