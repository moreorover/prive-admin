import { createId } from "@paralleldrive/cuid2"
import { and, count, eq, gte, lte, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment, personnelOnAppointments } from "../schema/appointment"
import { personnel } from "../schema/personnel"

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

function eligibleMaster(masterId: string) {
  return and(eq(personnel.customerId, masterId), eq(personnel.active, true), eq(personnel.type, "master"))
}

export async function createAppointment(database: Db = db, input: AppointmentInput) {
  const now = Date.now()
  const [result] = await database
    .insert(appointment)
    .select(
      database
        .select({
          id: sql`${createId()}`.as("id"),
          name: sql`${input.name}`.as("name"),
          startsAt: sql`${new Date(input.startsAt).getTime()}`.as("startsAt"),
          clientId: sql`${input.clientId}`.as("clientId"),
          masterId: personnel.customerId,
          salonId: sql`${input.salonId}`.as("salonId"),
          createdAt: sql`${now}`.as("createdAt"),
          updatedAt: sql`${now}`.as("updatedAt"),
        })
        .from(personnel)
        .where(eligibleMaster(input.masterId)),
    )
    .returning()
  return result
}

export async function linkPersonnelToAppointment(
  database: Db = db,
  input: { appointmentId: string; personnelIds: string[] },
) {
  if (input.personnelIds.length === 0) return []
  // Bind the whole set once. The uncorrelated guard admits all requested IDs or none.
  return database
    .insert(personnelOnAppointments)
    .select(sql`
      WITH requested AS (SELECT DISTINCT value AS id FROM json_each(${JSON.stringify(input.personnelIds)}))
      SELECT ${input.appointmentId}, id, cast(unixepoch('subsecond') * 1000 as integer)
      FROM requested
      WHERE NOT EXISTS (
        SELECT 1 FROM requested AS r
        LEFT JOIN personnel AS p ON p.customer_id = r.id AND p.active = 1
        LEFT JOIN appointment_personnel AS assigned ON assigned.personnel_id = r.id
          AND assigned.appointment_id = ${input.appointmentId}
        WHERE p.id IS NULL OR assigned.personnel_id IS NOT NULL
      )
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

  const [result] = await database
    .update(appointment)
    .set(values)
    .where(
      and(
        eq(appointment.id, input.id),
        input.masterId === undefined
          ? undefined
          : sql`exists (select 1 from ${personnel} where ${eligibleMaster(input.masterId)})`,
      ),
    )
    .returning()
  return result
}
