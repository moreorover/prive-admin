import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import {
  useBankAccountActions,
  useBankEntryAttachmentActions,
  useBankStatementEntryActions,
} from "./-actions/bank-account-actions"
import { BankAccountPage, STATEMENT_ENTRIES_PAGE_SIZE, type StatusFilter } from "./-components/bank-account-id-page"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId")({
  component: routeComponent,
})

function routeComponent() {
  const { bankAccountId, legalEntityId } = Route.useParams()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING")
  const [openAttachmentEntryId, setOpenAttachmentEntryId] = useState<string | null>(null)
  const [entriesPage, setEntriesPage] = useState(1)
  const legalEntitiesData = useQuery(trpc.legalEntities.list.queryOptions({ pageSize: 100 })).data
  const bankAccount = useQuery({
    ...trpc.bankAccounts.get.queryOptions({ id: bankAccountId }),
    enabled: bankAccountId !== "new",
  }).data
  const statementEntriesData = useQuery({
    ...trpc.bankStatementEntries.list.queryOptions({
      bankAccountId,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page: entriesPage,
      pageSize: STATEMENT_ENTRIES_PAGE_SIZE,
    }),
    enabled: bankAccountId !== "new",
  }).data
  const attachmentCounts = useQuery(trpc.bankStatementAttachments.counts.queryOptions()).data
  const attachmentsQuery = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ entryId: openAttachmentEntryId ?? "", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  })
  const unassignedAttachmentsData = useQuery({
    ...trpc.bankStatementAttachments.list.queryOptions({ assignmentStatus: "unassigned", pageSize: 100 }),
    enabled: !!openAttachmentEntryId,
  }).data
  const navigate = Route.useNavigate()
  const { create, update } = useBankAccountActions({
    bankAccountId: bankAccountId === "new" ? undefined : bankAccountId,
    onCreated: (values) => {
      navigate({
        to: "/legal-entities/$legalEntityId/bank-accounts",
        params: { legalEntityId: values.legalEntityId },
      })
    },
  })
  const { importCsv, ignore, undo } = useBankStatementEntryActions({
    onStatusChanged: () => setEntriesPage(1),
  })
  const { assign, remove, unassign, upload } = useBankEntryAttachmentActions()

  return (
    <BankAccountPage
      bankAccountId={bankAccountId}
      legalEntityId={legalEntityId}
      legalEntities={legalEntitiesData?.items ?? []}
      bankAccount={bankAccount}
      statementEntriesData={statementEntriesData}
      attachmentCounts={attachmentCounts}
      attachmentsData={attachmentsQuery.data}
      attachmentsLoading={attachmentsQuery.isLoading}
      unassignedAttachmentsData={unassignedAttachmentsData}
      statusFilter={statusFilter}
      openAttachmentEntryId={openAttachmentEntryId}
      entriesPage={entriesPage}
      onStatusFilterChange={(nextStatus) => {
        setStatusFilter(nextStatus)
        setEntriesPage(1)
      }}
      onOpenAttachmentEntryChange={setOpenAttachmentEntryId}
      onEntriesPageChange={setEntriesPage}
      createPending={create.isPending}
      updatePending={update.isPending}
      importPending={importCsv.isPending}
      ignorePending={ignore.isPending}
      undoPending={undo.isPending}
      assignPending={assign.isPending}
      removePending={remove.isPending}
      unassignPending={unassign.isPending}
      onCreate={(values) => create.mutate(values)}
      onUpdate={(values) => update.mutate(values)}
      onImportCsv={(csv) => importCsv.mutateAsync({ csv })}
      onIgnore={(id) => ignore.mutate({ id })}
      onUndo={(id) => undo.mutate({ id })}
      onAssign={(id, entryId) => assign.mutate({ id, entryId })}
      onRemove={(id) => remove.mutate({ id })}
      onUnassign={(id) => unassign.mutate({ id })}
      onUploadAttachment={(file, entryId) => upload(file, entryId)}
    />
  )
}
