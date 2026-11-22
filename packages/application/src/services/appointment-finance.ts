import {
  appointmentFinanceRows,
  monthlyFinanceRows,
  personnelAllocationRows,
  type FinancePeriod,
  type PersonnelFinanceFilter,
} from "@prive-admin-tanstack/db/repositories/appointment-finance"

type Pagination = { page?: number; pageSize?: number }

function withRemainder<T extends Awaited<ReturnType<typeof appointmentFinanceRows>>[number]>(row: T) {
  return { ...row, ownerRemainder: row.received - row.refunds + row.adjustments - row.personnelAllocations }
}

export async function getAppointmentFinance(appointmentId: string) {
  const rows = await appointmentFinanceRows(undefined, appointmentId)
  return { appointmentId, totals: rows.map(withRemainder) }
}

export async function getMonthlyAppointmentFinance({ page = 1, pageSize = 10, ...period }: FinancePeriod & Pagination) {
  const rows = await monthlyFinanceRows(undefined, period)
  const offset = (page - 1) * pageSize
  return { items: rows.slice(offset, offset + pageSize).map(withRemainder), page, pageSize, totalCount: rows.length }
}

export async function listPersonnelFinance({
  page = 1,
  pageSize = 10,
  ...filter
}: PersonnelFinanceFilter & Pagination) {
  const result = await personnelAllocationRows(undefined, { ...filter, pageSize, offset: (page - 1) * pageSize })
  return { ...result, page, pageSize }
}
