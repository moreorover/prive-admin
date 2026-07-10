import { createAppointmentRepository, type AppointmentRepository } from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

type AppointmentServiceDeps = {
  appointments: AppointmentRepository
}

export function createAppointmentService(
  deps: AppointmentServiceDeps = {
    appointments: createAppointmentRepository(),
  },
) {
  return {
    async listAppointments(input: {
      pageSize: number
      offset: number
      startDate?: string
      endDate?: string
      customerId?: string
      salonId?: string
    }) {
      return deps.appointments.list(input)
    },

    async getAppointment(id: string) {
      const result = await deps.appointments.get(id)
      if (!result) throw notFound("Appointment not found")
      return result
    },

    async createAppointment(input: {
      name: string
      startsAt: string | Date
      clientId: string
      masterId: string
      salonId: string
    }) {
      let result
      try {
        result = await deps.appointments.create(input)
      } catch (error) {
        throw unexpectedError("Failed to create appointment", error)
      }

      if (!result) {
        throw unexpectedError("Failed to create appointment")
      }

      return result
    },

    async linkPersonnelToAppointment(input: { appointmentId: string; personnelIds: string[] }) {
      try {
        return await deps.appointments.linkPersonnel(input)
      } catch (error) {
        throw unexpectedError("Failed to link personnel to appointment", error)
      }
    },

    async updateAppointment(input: { id: string; masterId: string }) {
      let result
      try {
        result = await deps.appointments.update(input)
      } catch (error) {
        throw unexpectedError("Failed to update appointment", error)
      }

      if (!result) {
        throw notFound("Appointment not found")
      }

      return result
    },
  }
}

const appointmentService = createAppointmentService()

export async function listAppointments(input: {
  pageSize: number
  offset: number
  startDate?: string
  endDate?: string
  customerId?: string
  salonId?: string
}) {
  return appointmentService.listAppointments(input)
}

export async function getAppointment(id: string) {
  return appointmentService.getAppointment(id)
}

export async function createAppointment(input: {
  name: string
  startsAt: string | Date
  clientId: string
  masterId: string
  salonId: string
}) {
  return appointmentService.createAppointment(input)
}

export async function linkPersonnelToAppointment(input: { appointmentId: string; personnelIds: string[] }) {
  return appointmentService.linkPersonnelToAppointment(input)
}

export async function updateAppointment(input: { id: string; masterId: string }) {
  return appointmentService.updateAppointment(input)
}
