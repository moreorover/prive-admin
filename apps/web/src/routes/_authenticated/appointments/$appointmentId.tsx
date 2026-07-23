import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useAppointmentPersonnelActions } from "../-actions/appointment-actions"
import { useHairAssignmentActions } from "../-actions/hair-assignment-actions"
import { useAppointmentTransactionActions } from "./-actions/appointment-transaction-actions"
import { AppointmentDetailPage } from "./-components/appointment-detail-page"
import {
  APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
  availableHairOrdersListQueryOptions,
  useAppointmentDetailData,
} from "./-data/appointment-detail-data"

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.appointments.get.queryOptions({ id: params.appointmentId })),
      context.queryClient.ensureQueryData(
        trpc.hairAssigned.list.queryOptions({
          page: 1,
          pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
          appointmentId: params.appointmentId,
        }),
      ),
      context.queryClient.ensureQueryData(
        trpc.transactions.list.queryOptions({
          page: 1,
          pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
          appointmentId: params.appointmentId,
        }),
      ),
      context.queryClient.ensureQueryData(trpc.userSettings.get.queryOptions()),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
  },
})

function RouteComponent() {
  const { appointmentId } = Route.useParams()
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [hairAssignedPage, setHairAssignedPage] = useState(1)
  const [masterSearch, setMasterSearch] = useState("")
  const [pickPersonnelSearch, setPickPersonnelSearch] = useState("")
  const detailData = useAppointmentDetailData({ appointmentId, hairAssignedPage, transactionsPage })
  const pickPersonnelCustomersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: pickPersonnelSearch.trim() || undefined,
    }),
  ).data
  const masterCustomersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: masterSearch.trim() || undefined,
    }),
  ).data
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
  const { createTransaction, updateTransaction, deleteTransaction } = useAppointmentTransactionActions({
    appointment: detailData.appointment,
  })
  const { updateMaster, linkPersonnel } = useAppointmentPersonnelActions({ appointmentId })

  return (
    <AppointmentDetailPage
      appointmentId={appointmentId}
      detailData={detailData}
      transactionsPage={transactionsPage}
      hairAssignedPage={hairAssignedPage}
      masterSearch={masterSearch}
      pickPersonnelSearch={pickPersonnelSearch}
      pickPersonnelCustomersData={pickPersonnelCustomersData}
      masterCustomersData={masterCustomersData}
      onTransactionsPageChange={setTransactionsPage}
      onHairAssignedPageChange={setHairAssignedPage}
      onMasterSearchChange={setMasterSearch}
      onPickPersonnelSearchChange={setPickPersonnelSearch}
      createHairAssignedPending={createHairAssigned.isPending}
      updateHairAssignedPending={updateHairAssigned.isPending}
      deleteHairAssignedPending={deleteHairAssigned.isPending}
      createTransactionPending={createTransaction.isPending}
      updateTransactionPending={updateTransaction.isPending}
      deleteTransactionPending={deleteTransaction.isPending}
      updateMasterPending={updateMaster.isPending}
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
      onUpdateMaster={(values) => updateMaster.mutate(values)}
      onLinkPersonnel={(values) => linkPersonnel.mutate(values)}
    />
  )
}
