import { and, asc, count, eq, getTableColumns, or, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { customer, personnel } from "../schema"

export type PersonnelType = typeof personnel.$inferSelect.type

export type PersonnelListFilter = {
  pageSize?: number
  offset?: number
  search?: string
  activeOnly?: boolean
  type?: PersonnelType
}

export type PersonnelCreateInput = {
  customerId: string
  type: PersonnelType
  salonId?: string | null
}

export type PersonnelUpdateInput = {
  customerId: string
  type?: PersonnelType
  active?: boolean
  salonId?: string | null
}

export async function listPersonnel(database: Db = db, filter: PersonnelListFilter = {}) {
  const pattern = filter.search ? `%${filter.search.replace(/[\\%_]/g, "\\$&")}%` : undefined
  const where = and(
    filter.activeOnly ? eq(personnel.active, true) : undefined,
    filter.type ? eq(personnel.type, filter.type) : undefined,
    pattern
      ? or(sql`${customer.name} like ${pattern} escape '\\'`, sql`${customer.phoneNumber} like ${pattern} escape '\\'`)
      : undefined,
  )

  const items = await database
    .select({ ...getTableColumns(personnel), customer })
    .from(personnel)
    .innerJoin(customer, eq(personnel.customerId, customer.id))
    .where(where)
    .orderBy(asc(customer.name), asc(personnel.customerId))
    .limit(filter.pageSize ?? 10)
    .offset(filter.offset ?? 0)
  const [countRow] = await database
    .select({ totalCount: count() })
    .from(personnel)
    .innerJoin(customer, eq(personnel.customerId, customer.id))
    .where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getPersonnel(database: Db = db, customerId: string) {
  return database.query.personnel.findFirst({
    where: eq(personnel.customerId, customerId),
    with: { customer: true },
  })
}

export async function createPersonnel(database: Db = db, input: PersonnelCreateInput) {
  const [result] = await database.insert(personnel).values(input).returning()
  return result
}

export async function updatePersonnel(database: Db = db, input: PersonnelUpdateInput) {
  const { customerId, ...changes } = input
  const [result] = await database.update(personnel).set(changes).where(eq(personnel.customerId, customerId)).returning()
  return result
}
