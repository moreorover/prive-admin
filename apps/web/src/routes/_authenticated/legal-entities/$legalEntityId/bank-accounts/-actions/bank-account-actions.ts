import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type Currency } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export type BankAccountFormValues = {
  legalEntityId: string
  iban: string
  currency: Currency
  bankName: string
  swift: string
  displayName: string
}

type SavedBankAccountValues = {
  legalEntityId: string
  iban: string
  currency: Currency
  bankName?: string | null
  swift?: string | null
  displayName: string
}

export function useBankStatementEntryActions({
  onImported,
  onStatusChanged,
}: {
  onImported?: (result: { accountIban: string; total: number; inserted: number; skipped: number }) => void
  onStatusChanged?: () => void
}) {
  const queryClient = useQueryClient()

  const invalidateEntries = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.bankStatementEntries.list.queryKey() })
  }

  const importCsv = useMutation({
    ...trpc.bankStatementEntries.importCsv.mutationOptions(),
    onSuccess: async (result) => {
      onImported?.(result)
      notifications.show({
        color: "green",
        message: `Imported ${result.inserted} new entries (${result.skipped} duplicates skipped)`,
      })
      await invalidateEntries()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const ignore = useMutation({
    ...trpc.bankStatementEntries.ignore.mutationOptions(),
    onSuccess: async () => {
      onStatusChanged?.()
      notifications.show({ color: "yellow", message: "Marked as ignored" })
      await invalidateEntries()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const undo = useMutation({
    ...trpc.bankStatementEntries.undo.mutationOptions(),
    onSuccess: async () => {
      onStatusChanged?.()
      notifications.show({ color: "green", message: "Restored to pending" })
      await invalidateEntries()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return { importCsv, ignore, undo }
}

export function useBankEntryAttachmentActions() {
  const queryClient = useQueryClient()

  const invalidateAttachments = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
    ])
  }

  const remove = useMutation({
    ...trpc.bankStatementAttachments.delete.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidateAttachments()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const unassign = useMutation({
    ...trpc.bankStatementAttachments.unassign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidateAttachments()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const assign = useMutation({
    ...trpc.bankStatementAttachments.assign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Attached" })
      await invalidateAttachments()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const upload = async (file: File, entryId: string) => {
    const fd = new FormData()
    fd.append("entryId", entryId)
    fd.append("file", file)
    const res = await fetch("/api/statement-attachments/upload", { method: "POST", body: fd })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Upload failed (${res.status})`)
    }
    notifications.show({ color: "green", message: "Uploaded" })
    await invalidateAttachments()
  }

  return { assign, remove, unassign, upload }
}

export function useBankAccountActions({
  bankAccountId,
  onCreated,
  onUpdated,
}: {
  bankAccountId?: string
  onCreated?: (values: SavedBankAccountValues) => void
  onUpdated?: (values: SavedBankAccountValues) => void
}) {
  const queryClient = useQueryClient()

  const update = useMutation({
    ...trpc.bankAccounts.update.mutationOptions(),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await Promise.all([
        bankAccountId
          ? queryClient.invalidateQueries({
              queryKey: trpc.bankAccounts.get.queryOptions({ id: bankAccountId }).queryKey,
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: trpc.legalEntities.get.queryOptions({ id: values.legalEntityId }).queryKey,
        }),
      ])
      onUpdated?.(values)
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const create = useMutation({
    ...trpc.bankAccounts.create.mutationOptions(),
    onSuccess: async (_, values) => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({
        queryKey: trpc.legalEntities.get.queryOptions({ id: values.legalEntityId }).queryKey,
      })
      onCreated?.(values)
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return { create, update }
}
