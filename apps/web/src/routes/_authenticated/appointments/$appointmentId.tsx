import { useDebouncedValue } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useAppointmentPersonnelActions } from "../-actions/appointment-actions"
import { useHairAssignmentActions } from "../-actions/hair-assignment-actions"
import { appointmentFinanceQueryOptions } from "../-data/appointment-finance-data"
import { useAppointmentTransactionActions } from "./-actions/appointment-transaction-actions"
import { AppointmentDetailPage } from "./-components/appointment-detail-page"
import {
  appointmentDetailQueryOptions,
  appointmentHairAssignedQueryOptions,
  appointmentTransactionsQueryOptions,
  appointmentPersonnelOptionsQueryOptions,
  appointmentMasterOptionsQueryOptions,
  useAppointmentDetailData,
} from "./-data/appointment-detail-data"

const searchDebounceMs = 300

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.isAdmin &&
        context.queryClient.ensureQueryData(appointmentFinanceQueryOptions(params.appointmentId, context.isAdmin)),
      context.queryClient.ensureQueryData(appointmentDetailQueryOptions(params.appointmentId)),
      context.queryClient.ensureQueryData(appointmentHairAssignedQueryOptions(params.appointmentId, 1)),
      context.queryClient.ensureQueryData(appointmentTransactionsQueryOptions(params.appointmentId, 1)),
      context.queryClient.ensureQueryData(trpc.userSettings.get.queryOptions()),
    ])
  },
})

function RouteComponent() {
  const { appointmentId } = Route.useParams()
  const { isAdmin } = Route.useRouteContext()
  const finance = useQuery(appointmentFinanceQueryOptions(appointmentId, isAdmin))
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [hairAssignedPage, setHairAssignedPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [pickPersonnelOpen, setPickPersonnelOpen] = useState(false)
  const [changeMasterOpen, setChangeMasterOpen] = useState(false)
  const [masterSearch, setMasterSearch] = useState("")
  const [pickPersonnelSearch, setPickPersonnelSearch] = useState("")
  const [debouncedMasterSearch] = useDebouncedValue(masterSearch, searchDebounceMs)
  const [debouncedPickPersonnelSearch] = useDebouncedValue(pickPersonnelSearch, searchDebounceMs)
  const detailData = useAppointmentDetailData({
    appointmentId,
    hairAssignedPage,
    transactionsPage,
    availableHairOrdersEnabled: createOpen,
  })
  const pickPersonnelCustomersData = useQuery({
    ...appointmentPersonnelOptionsQueryOptions(debouncedPickPersonnelSearch),
    enabled: pickPersonnelOpen,
  }).data
  const masterCustomersData = useQuery({
    ...appointmentMasterOptionsQueryOptions(debouncedMasterSearch),
    enabled: changeMasterOpen,
  }).data
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [
      { queryKey: detailData.appointmentQueryOptions.queryKey },
      ...(detailData.appointment
        ? [{ queryKey: trpc.customers.summary.queryOptions({ id: detailData.appointment.client.id }).queryKey }]
        : []),
    ],
    selectedEditItem: null,
    selectedDeleteItem: null,
  })
  const { createTransaction, updateTransaction, deleteTransaction, resolveCurrency } = useAppointmentTransactionActions(
    {
      appointment: detailData.appointment,
    },
  )
  const { updateAppointment, linkPersonnel } = useAppointmentPersonnelActions({
    appointmentId,
    onPersonnelLinked: () => {
      setPickPersonnelOpen(false)
      setPickPersonnelSearch("")
    },
  })

  return (
    <AppointmentDetailPage
      financeTotals={isAdmin ? finance.data?.totals : undefined}
      appointmentId={appointmentId}
      detailData={detailData}
      transactionsPage={transactionsPage}
      hairAssignedPage={hairAssignedPage}
      createOpen={createOpen}
      pickPersonnelOpen={pickPersonnelOpen}
      changeMasterOpen={changeMasterOpen}
      pickPersonnelSearch={pickPersonnelSearch}
      pickPersonnelCustomersData={pickPersonnelCustomersData}
      masterCustomersData={masterCustomersData}
      onTransactionsPageChange={setTransactionsPage}
      onHairAssignedPageChange={setHairAssignedPage}
      onCreateOpenChange={setCreateOpen}
      onPickPersonnelOpenChange={setPickPersonnelOpen}
      onChangeMasterOpenChange={setChangeMasterOpen}
      onMasterSearchChange={setMasterSearch}
      onPickPersonnelSearchChange={setPickPersonnelSearch}
      createHairAssignedPending={createHairAssigned.isPending}
      updateHairAssignedPending={updateHairAssigned.isPending}
      deleteHairAssignedPending={deleteHairAssigned.isPending}
      createTransactionPending={createTransaction.isPending}
      updateTransactionPending={updateTransaction.isPending || resolveCurrency.isPending}
      onResolveCurrency={isAdmin ? (values) => resolveCurrency.mutate(values) : undefined}
      deleteTransactionPending={deleteTransaction.isPending}
      updateAppointmentPending={updateAppointment.isPending}
      linkPersonnelPending={linkPersonnel.isPending}
      onCreateHairAssigned={(values) => {
        createHairAssigned.mutate(values)
        setHairAssignedPage(1)
      }}
      onUpdateHairAssigned={(values) => updateHairAssigned.mutate(values)}
      onDeleteHairAssigned={(id) => {
        deleteHairAssigned.mutate({ id })
        setHairAssignedPage(1)
      }}
      onCreateTransaction={(values) => {
        createTransaction.mutate(values)
        setTransactionsPage(1)
      }}
      onUpdateTransaction={(values) => updateTransaction.mutate(values)}
      onDeleteTransaction={(id) => {
        deleteTransaction.mutate({ id })
        setTransactionsPage(1)
      }}
      onUpdateAppointment={(values) => updateAppointment.mutate(values)}
      onUpdateMaster={(values) => updateAppointment.mutate(values)}
      onLinkPersonnel={(values) => linkPersonnel.mutate(values)}
    />
  )
}
