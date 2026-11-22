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

type NumericTotals = {
  received: number
  refunds: number
  adjustments: number
  personnelAllocations: number
  ownerRemainder: number
}

function withRemainder<T extends Awaited<ReturnType<typeof appointmentFinanceRows>>[number]>(
  row: T,
): Omit<T, keyof NumericTotals> & NumericTotals {
  const received = BigInt(row.received)
  const refunds = BigInt(row.refunds)
  const adjustments = BigInt(row.adjustments)
  const personnelAllocations = BigInt(row.personnelAllocations)
  const ownerRemainder = received - refunds + adjustments - personnelAllocations
  return {
    ...row,
    received: toSafeNumber(received, "received"),
    refunds: toSafeNumber(refunds, "refunds"),
    adjustments: toSafeNumber(adjustments, "adjustments"),
    personnelAllocations: toSafeNumber(personnelAllocations, "personnel allocations"),
    ownerRemainder: toSafeNumber(ownerRemainder, "owner remainder"),
  } as Omit<T, keyof NumericTotals> & NumericTotals
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
  return {
    items: result.items.map((item) => ({ ...item, allocated: toSafeNumber(item.allocated, "personnel allocations") })),
    totalCount: result.totalCount,
    page,
    pageSize,
  }
}
