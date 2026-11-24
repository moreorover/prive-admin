import { notifications } from "@mantine/notifications"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useBankTransactionImport } from "./-actions/bank-transaction-import-actions"
import { BankTransactionsPage } from "./-components/bank-transactions-page"
import {
  bankTransactionsOptionsQueryOptions,
  bankTransactionsQueryOptions,
  bankTransactionsSearchSchema,
  normalizeBankTransactionsAccount,
  updateBankTransactionsFilters,
} from "./-data/bank-transactions-data"
import {
  useBankEntryAttachmentActions,
  useBankStatementEntryActions,
} from "./legal-entities/$legalEntityId/bank-accounts/-actions/bank-account-actions"

export const Route = createFileRoute("/_authenticated/bank-transactions")({
  component: RouteComponent,
  validateSearch: bankTransactionsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const options = await context.queryClient.fetchQuery(bankTransactionsOptionsQueryOptions(context.queryClient))
    const normalized = normalizeBankTransactionsAccount(deps, options.accounts)
    if (normalized !== deps) {
      throw redirect({ to: "/bank-transactions", search: normalized, replace: true })
    }
    await Promise.all([
      context.queryClient.ensureQueryData(bankTransactionsQueryOptions(deps)),
      context.queryClient.ensureQueryData(trpc.bankStatementAttachments.counts.queryOptions()),
    ])
  },
})

function RouteComponent() {
  const importAction = useBankTransactionImport()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { queryClient } = Route.useRouteContext()
  const optionsQuery = useQuery(bankTransactionsOptionsQueryOptions(queryClient))
  const transactionsQuery = useQuery(bankTransactionsQueryOptions(search))
  const [openAttachmentEntryId, setOpenAttachmentEntryId] = useState<string | null>(null)
  const [uploadingAttachmentEntryId, setUploadingAttachmentEntryId] = useState<string | null>(null)
  const attachmentCounts = useQuery(trpc.bankStatementAttachments.counts.queryOptions())
  const attachmentsQuery = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ entryId: openAttachmentEntryId ?? "", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  })
  const unassignedAttachmentsQuery = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  })
  const { ignore, undo } = useBankStatementEntryActions({
    onStatusChanged: () => {
      setOpenAttachmentEntryId(null)
      void navigate({ search: (current) => ({ ...current, page: 1 }) })
    },
  })
  const { assign, remove, unassign, upload } = useBankEntryAttachmentActions()

  const handleUpload = (file: File, entryId: string) => {
    setUploadingAttachmentEntryId(entryId)
    return upload(file, entryId)
      .catch((error: unknown) => {
        notifications.show({ color: "red", message: (error as Error).message })
      })
      .finally(() => setUploadingAttachmentEntryId(null))
  }

  return (
    <BankTransactionsPage
      importAction={importAction}
      search={search}
      options={optionsQuery.data ?? { entities: [], accounts: [] }}
      result={transactionsQuery.data}
      isFetching={transactionsQuery.isFetching || optionsQuery.isFetching}
      error={transactionsQuery.error?.message ?? optionsQuery.error?.message ?? null}
      review={{
        attachmentCounts: attachmentCounts.data,
        attachments: attachmentsQuery.data?.items.map((row) => row.attachment) ?? [],
        attachmentsLoading: attachmentsQuery.isFetching || unassignedAttachmentsQuery.isFetching,
        unassignedAttachments: unassignedAttachmentsQuery.data?.items.map((row) => row.attachment) ?? [],
        openAttachmentEntryId,
        uploadingAttachmentEntryId,
        assignPending: assign.isPending,
        removePending: remove.isPending,
        unassignPending: unassign.isPending,
        ignorePending: ignore.isPending,
        undoPending: undo.isPending,
        onOpenAttachmentEntryChange: setOpenAttachmentEntryId,
        onAssign: (id, entryId) => assign.mutate({ id, entryId }),
        onRemove: (id) => remove.mutate({ id }),
        onUnassign: (id) => unassign.mutate({ id }),
        onUpload: handleUpload,
        onIgnore: (id) => ignore.mutate({ id }),
        onUndo: (id) => undo.mutate({ id }),
      }}
      onFiltersChange={(filters) => {
        setOpenAttachmentEntryId(null)
        return navigate({
          search: (current) => updateBankTransactionsFilters(current, filters, optionsQuery.data?.accounts ?? []),
        })
      }}
      onPageChange={(page) => {
        setOpenAttachmentEntryId(null)
        return navigate({ search: (current) => ({ ...current, page }) })
      }}
    />
  )
}
