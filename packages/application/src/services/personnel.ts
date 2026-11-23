import type {
  PersonnelCreateInput,
  PersonnelListFilter,
  PersonnelType,
  PersonnelUpdateInput,
} from "@prive-admin-tanstack/db"

import {
  createPersonnel as insertPersonnel,
  getCustomer,
  getPersonnel as findPersonnel,
  getSalon,
  listPersonnel as fetchPersonnel,
  listPersonnelByCustomerIds as fetchPersonnelByCustomerIds,
  updatePersonnel as patchPersonnel,
} from "@prive-admin-tanstack/db"

import { badRequest, conflict, notFound, unexpectedError } from "../errors"

export async function listPersonnel(input: PersonnelListFilter = {}) {
  return fetchPersonnel(undefined, { ...input, pageSize: input.pageSize ?? 10, offset: input.offset ?? 0 })
}

export async function getPersonnel(customerId: string) {
  const result = await findPersonnel(undefined, customerId)
  if (!result) throw notFound("Personnel profile not found")
  return result
}

async function assertSalonExists(salonId: string | null | undefined) {
  if (salonId != null && !(await getSalon(undefined, salonId))) throw notFound("Salon not found")
}

export async function createPersonnel(input: PersonnelCreateInput) {
  if (!(await getCustomer(undefined, input.customerId))) throw notFound("Customer not found")
  if (await findPersonnel(undefined, input.customerId)) throw conflict("Personnel profile already exists")
  await assertSalonExists(input.salonId)

  let result
  try {
    result = await insertPersonnel(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create personnel profile", error)
  }
  if (!result) throw unexpectedError("Failed to create personnel profile")
  return result
}

export async function updatePersonnel(input: PersonnelUpdateInput) {
  if (input.type === undefined && input.active === undefined && input.salonId === undefined) {
    throw badRequest("Personnel update requires at least one change")
  }
  await getPersonnel(input.customerId)
  await assertSalonExists(input.salonId)

  let result
  try {
    result = await patchPersonnel(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update personnel profile", error)
  }
  if (!result) throw notFound("Personnel profile not found")
  return result
}

export async function assertActivePersonnel(customerId: string, options: { type?: PersonnelType } = {}) {
  const result = await findPersonnel(undefined, customerId)
  if (!result) throw badRequest("Customer does not have a personnel profile")
  if (!result.active) throw badRequest("Personnel profile is inactive")
  if (options.type && result.type !== options.type) throw badRequest(`Personnel must be a ${options.type}`)
  return result
}

export async function assertActivePersonnelBatch(customerIds: string[]) {
  const profiles = await fetchPersonnelByCustomerIds(undefined, customerIds)
  const eligibleIds = new Set(profiles.map((profile) => profile.customerId))
  const ineligibleId = customerIds.find((customerId) => !eligibleIds.has(customerId))
  if (ineligibleId) throw badRequest("Customer does not have an active personnel profile")
  return profiles
}
