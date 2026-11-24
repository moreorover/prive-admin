import {
  appointmentFinanceRows,
  monthlyFinanceRows,
  personnelAllocationRows,
  type FinancePeriod,
  type PersonnelFinanceFilter,
} from "@prive-admin-tanstack/db/repositories/appointment-finance"

import { unexpectedError } from "../errors"

type Pagination = { page?: number; pageSize?: number }

function toSafeNumber(value: string | number | bigint, label: string) {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw unexpectedError(`${label} aggregate exceeds the safe integer range`)
  }
  let integer: bigint
  try {
    integer = typeof value === "bigint" ? value : BigInt(value)
  } catch (error) {
    throw unexpectedError(`Invalid ${label} aggregate`, error)
  }
  if (integer > BigInt(Number.MAX_SAFE_INTEGER) || integer < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw unexpectedError(`${label} aggregate exceeds the safe integer range`)
  }
  return Number(integer)
}

type NumericTotals = { total: number }

function withTotal<T extends Awaited<ReturnType<typeof appointmentFinanceRows>>[number]>(
  row: T,
): Omit<T, keyof NumericTotals> & NumericTotals {
  return {
    ...row,
    total: toSafeNumber(BigInt(row.total), "appointment finance total"),
  } as Omit<T, keyof NumericTotals> & NumericTotals
}

export async function getAppointmentFinance(appointmentId: string) {
  const rows = await appointmentFinanceRows(undefined, appointmentId)
  return { appointmentId, totals: rows.map(withTotal) }
}

export async function getMonthlyAppointmentFinance({ page = 1, pageSize = 10, ...period }: FinancePeriod & Pagination) {
  const { items, totalCount } = await monthlyFinanceRows(undefined, {
    ...period,
    pageSize,
    offset: (page - 1) * pageSize,
  })
  return { items: items.map(withTotal), page, pageSize, totalCount }
}

export async function listPersonnelFinance({
  page = 1,
  pageSize = 10,
  ...filter
}: PersonnelFinanceFilter & Pagination) {
  const result = await personnelAllocationRows(undefined, { ...filter, pageSize, offset: (page - 1) * pageSize })
  return {
    items: result.items.map((item) => ({
      ...item,
      appointmentCount: toSafeNumber(item.appointmentCount, "personnel appointment count"),
      paid: toSafeNumber(item.paid, "personnel paid amount"),
      credits: toSafeNumber(item.credits, "personnel credits amount"),
    })),
    totalCount: result.totalCount,
    page,
    pageSize,
  }
}
