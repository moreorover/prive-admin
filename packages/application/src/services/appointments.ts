import {
  createAppointment as insertAppointment,
  getAppointment as findAppointment,
  linkPersonnelToAppointment as insertAppointmentPersonnel,
  listAppointments as fetchAppointments,
  updateAppointment as patchAppointment,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

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
  let result
  try {
    result = await insertAppointment(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create appointment", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create appointment")
  }

  return result
}

export async function linkPersonnelToAppointment(input: { appointmentId: string; personnelIds: string[] }) {
  try {
    return await insertAppointmentPersonnel(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to link personnel to appointment", error)
  }
}

export async function updateAppointment(input: { id: string; masterId: string }) {
  let result
  try {
    result = await patchAppointment(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update appointment", error)
  }

  if (!result) {
    throw notFound("Appointment not found")
  }

  return result
}
