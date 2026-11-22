import { and, count, eq, gte, lte, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment, personnelOnAppointments } from "../schema/appointment"

export type AppointmentListFilter = {
  pageSize: number
  offset: number
  startDate?: string
  endDate?: string
  customerId?: string
  salonId?: string
}

export type AppointmentInput = {
  id?: string
  name: string
  startsAt: string | Date
  clientId: string
  masterId: string
  salonId: string
}

export async function listAppointments(database: Db = db, filter: AppointmentListFilter) {
  const conditions = []
  if (filter.startDate) conditions.push(gte(appointment.startsAt, new Date(filter.startDate)))
  if (filter.endDate) conditions.push(lte(appointment.startsAt, new Date(filter.endDate)))
  if (filter.customerId) conditions.push(eq(appointment.clientId, filter.customerId))
  if (filter.salonId) conditions.push(eq(appointment.salonId, filter.salonId))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await database.query.appointment.findMany({
    where,
    with: { client: true, master: true, salon: true },
    orderBy: (a, { asc, desc }) => [filter.customerId ? desc(a.startsAt) : asc(a.startsAt)],
    limit: filter.pageSize,
    offset: filter.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(appointment).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getAppointment(database: Db = db, id: string) {
  return database.query.appointment.findFirst({
    where: eq(appointment.id, id),
    with: {
      client: true,
      master: true,
      salon: true,
      personnel: { with: { personnel: true } },
      notes: { with: { createdBy: true } },
    },
  })
}

export async function createAppointment(database: Db = db, input: AppointmentInput) {
  const [result] = await database
    .insert(appointment)
    .values({
      name: input.name,
      startsAt: new Date(input.startsAt),
      clientId: input.clientId,
      masterId: input.masterId,
      salonId: input.salonId,
    })
    .returning()
  return result
}

export async function linkPersonnelToAppointment(
  database: Db = db,
  input: { appointmentId: string; personnelIds: string[] },
) {
  if (input.personnelIds.length === 0) return []
  const requestedPersonnelValues = sql.join(
    input.personnelIds.map((personnelId) => sql`SELECT ${personnelId} AS personnel_id`),
    sql` UNION ALL `,
  )
  const requestedPersonnel = sql`
    SELECT DISTINCT personnel_id
    FROM (${requestedPersonnelValues}) AS requested_values
  `
  const existingAssignment = sql`
    SELECT 1
    FROM ${personnelOnAppointments} AS existing
    WHERE existing.appointment_id = ${input.appointmentId}
      AND existing.personnel_id IN (
        SELECT personnel_id FROM (${requestedPersonnel}) AS requested_conflicts
      )
  `

  return database
    .insert(personnelOnAppointments)
    .select(sql`
      SELECT ${input.appointmentId}, requested.personnel_id, (cast(unixepoch('subsecond') * 1000 as integer))
      FROM (${requestedPersonnel}) AS requested
      WHERE NOT EXISTS (${existingAssignment})
    `)
    .returning()
}

export async function updateAppointment(
  database: Db = db,
  input: { id: string; name?: string; masterId?: string; startsAt?: string | Date },
) {
  const values: Partial<Pick<AppointmentInput, "name" | "masterId">> & { startsAt?: Date } = {}
  if (input.name !== undefined) values.name = input.name
  if (input.masterId !== undefined) values.masterId = input.masterId
  if (input.startsAt !== undefined) values.startsAt = new Date(input.startsAt)

  const [result] = await database.update(appointment).set(values).where(eq(appointment.id, input.id)).returning()
  return result
}
