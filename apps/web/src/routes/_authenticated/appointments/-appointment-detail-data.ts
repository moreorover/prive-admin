import { useQuery } from "@tanstack/react-query"

import { type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { type TransactionRow } from "@/components/transactions/transactions-table"
import { CURRENCIES, type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE = 25
export const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100

const ZERO_TRANSACTION_TOTALS = Object.fromEntries(CURRENCIES.map((currency) => [currency, 0])) as Record<
  Currency,
  number
>

export function appointmentDetailQueryOptions(appointmentId: string) {
  return trpc.appointments.get.queryOptions({ id: appointmentId })
}

export function appointmentHairAssignedQueryOptions(appointmentId: string, page: number) {
  return trpc.hairAssigned.list.queryOptions({
    page,
    pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
    appointmentId,
  })
}

export function appointmentTransactionsQueryOptions(appointmentId: string, page: number) {
  return trpc.transactions.list.queryOptions({
    page,
    pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
    appointmentId,
  })
}

export function availableHairOrdersListQueryOptions() {
  return trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  })
}

export function useAppointmentDetailData({
  appointmentId,
  hairAssignedPage,
  transactionsPage,
}: {
  appointmentId: string
  hairAssignedPage: number
  transactionsPage: number
}) {
  const appointmentQueryOptions = appointmentDetailQueryOptions(appointmentId)
  const availableHairOrdersQueryOptions = availableHairOrdersListQueryOptions()
  const hairAssignedQueryOptions = appointmentHairAssignedQueryOptions(appointmentId, hairAssignedPage)
  const transactionsQueryOptions = appointmentTransactionsQueryOptions(appointmentId, transactionsPage)

  const { data: appointment } = useQuery(appointmentQueryOptions)
  const { data: availableHairOrdersData, isLoading: availableHairOrdersLoading } = useQuery(
    availableHairOrdersQueryOptions,
  )
  const { data: hairAssignedData } = useQuery(hairAssignedQueryOptions)
  const { data: transactionsData } = useQuery(transactionsQueryOptions)
  const { data: userSettings } = useQuery(trpc.userSettings.get.queryOptions())

  const hairAssigned = (hairAssignedData?.items ?? []) as HairAssignedRow[]
  const hairAssignedTotalCount = hairAssignedData?.totalCount ?? 0
  const hairAssignedTotalPages = Math.max(1, Math.ceil(hairAssignedTotalCount / APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE))
  const showHairAssignedPagination = hairAssignedTotalCount > APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE

  const txList = transactionsData?.items ?? []
  const txRows: TransactionRow[] = txList.map((t) => ({
    ...t,
    currency: (CURRENCIES as readonly string[]).includes(t.currency) ? (t.currency as Currency) : "EUR",
  }))
  const transactionsTotalCount = transactionsData?.totalCount ?? 0
  const transactionsTotalPages = Math.max(1, Math.ceil(transactionsTotalCount / APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE))
  const showTransactionsPagination = transactionsTotalCount > APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE
  const totalsByCurrency = { ...ZERO_TRANSACTION_TOTALS }
  for (const t of txRows) totalsByCurrency[t.currency] += t.amount
  const currenciesPresent = CURRENCIES.filter((currency) => totalsByCurrency[currency] !== 0)
  const txDefaultCurrency: Currency =
    userSettings?.preferredCurrency && (CURRENCIES as readonly string[]).includes(userSettings.preferredCurrency)
      ? (userSettings.preferredCurrency as Currency)
      : "EUR"

  return {
    appointment,
    appointmentQueryOptions,
    availableHairOrders: availableHairOrdersData?.items ?? [],
    availableHairOrdersLoading,
    availableHairOrdersQueryOptions,
    hairAssigned,
    hairAssignedTotalCount,
    hairAssignedTotalPages,
    showHairAssignedPagination,
    txRows,
    transactionsTotalCount,
    transactionsTotalPages,
    showTransactionsPagination,
    totalsByCurrency,
    currenciesPresent,
    txDefaultCurrency,
  }
}
