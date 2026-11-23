import {
  createAppointment as insertAppointment,
  getAppointment as findAppointment,
  linkPersonnelToAppointment as insertAppointmentPersonnel,
  listAppointments as fetchAppointments,
  updateAppointment as patchAppointment,
} from "@prive-admin-tanstack/db"

import { badRequest, conflict, notFound, unexpectedError } from "../errors"
import { assertActivePersonnel, assertActivePersonnelBatch } from "./personnel"

export async function listAppointments(input: {
  pageSize: number
  offset: number
  startDate?: string
  endDate?: string
  customerId?: string
  salonId?: string
}) {
  return fetchAppointments(undefined, input)
}

export async function getAppointment(id: string) {
  const result = await findAppointment(undefined, id)
  if (!result) throw notFound("Appointment not found")
  return result
}

export async function createAppointment(input: {
  name: string
  startsAt: string | Date
  clientId: string
  masterId: string
  salonId: string
}) {
  await assertActivePersonnel(input.masterId, { type: "master" })
  let result
  try {
    result = await insertAppointment(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create appointment", error)
  }

  if (!result) {
    throw conflict("Master eligibility changed before the appointment was created")
  }

  return result
}

export async function linkPersonnelToAppointment(input: { appointmentId: string; personnelIds: string[] }) {
  if (input.personnelIds.length === 0) return
  if (new Set(input.personnelIds).size !== input.personnelIds.length) {
    throw badRequest("Personnel IDs must be unique")
  }

  const appointment = await getAppointment(input.appointmentId)
  await assertActivePersonnelBatch(input.personnelIds)
  const assignedIds = new Set(appointment.personnel.map((link) => link.personnelId))
  if (input.personnelIds.some((id) => assignedIds.has(id))) {
    throw conflict("Personnel already assigned to appointment")
  }

  let inserted
  try {
    inserted = await insertAppointmentPersonnel(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to link personnel to appointment", error)
  }
  if (inserted.length !== input.personnelIds.length) {
    throw conflict("Personnel eligibility or assignment changed. Refresh the appointment and try again.")
  }
}

export async function updateAppointment(input: {
  id: string
  name?: string
  masterId?: string
  startsAt?: string | Date
}) {
  if (input.masterId !== undefined) await assertActivePersonnel(input.masterId, { type: "master" })
  let result
  try {
    result = await patchAppointment(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update appointment", error)
  }

  if (!result) {
    if (input.masterId !== undefined && (await findAppointment(undefined, input.id)))
      throw conflict("Master eligibility changed before the appointment was updated")
    throw notFound("Appointment not found")
  }

  return result
}
