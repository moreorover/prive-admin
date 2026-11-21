import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"

import type {
  BankStatementImportPreview,
  BankStatementImportResult,
} from "@/components/bank-transactions/bank-transaction-import"

import { trpc } from "@/utils/trpc"

type ImportState = {
  opened: boolean
  file: File | null
  confirmation: { csv: string; preview: BankStatementImportPreview } | null
  previewPending: boolean
  importPending: boolean
  importResult: BankStatementImportResult | null
  error: string | null
}
const initialState: ImportState = {
  opened: false,
  file: null,
  confirmation: null,
  previewPending: false,
  importPending: false,
  importResult: null,
  error: null,
}

// This route owner retains the exact CSV snapshot approved by the user.
export function useBankTransactionImport() {
  const queryClient = useQueryClient()
  const [state, setState] = useState(initialState)
  const current = useRef(initialState)
  const revision = useRef(0)
  const previewCsv = useMutation({ ...trpc.bankStatementEntries.previewCsv.mutationOptions(), gcTime: 0 })
  const importCsv = useMutation({ ...trpc.bankStatementEntries.importCsv.mutationOptions(), gcTime: 0 })
  const update = (patch: Partial<ImportState>) => {
    current.current = { ...current.current, ...patch }
    setState(current.current)
  }

  const onFileChange = (file: File | null) => {
    if (current.current.importPending) return
    revision.current += 1
    update({ ...initialState, opened: current.current.opened, file })
  }

  const onPreview = async () => {
    const file = current.current.file
    if (!file || current.current.previewPending || current.current.importPending) return
    const request = ++revision.current
    update({ confirmation: null, previewPending: true, importResult: null, error: null })
    // File reads and requests may finish after the user has selected another file.
    await file
      .text()
      .then(async (csv) => {
        if (revision.current !== request) return
        return previewCsv.mutateAsync({ csv }).then((preview) => {
          if (revision.current === request) update({ confirmation: { csv, preview } })
        })
      })
      .catch((error: unknown) => {
        if (revision.current === request) update({ error: (error as Error).message })
      })
      .finally(() => {
        if (revision.current === request) {
          update({ previewPending: false })
          previewCsv.reset()
        }
      })
  }

  const onImport = async () => {
    const confirmation = current.current.confirmation
    if (!confirmation || current.current.previewPending || current.current.importPending) return
    update({ importPending: true, error: null })
    await importCsv
      .mutateAsync({ csv: confirmation.csv })
      .then(async (result) => {
        update({ file: null, confirmation: null, importResult: result })
        notifications.show({
          color: "green",
          message: `Imported ${result.inserted} new entries (${result.skipped} duplicates skipped)`,
        })
        await queryClient.invalidateQueries({ queryKey: trpc.bankStatementEntries.list.queryKey() })
      })
      .catch((error: unknown) => {
        update({ confirmation: null, error: (error as Error).message })
        notifications.show({ color: "red", message: (error as Error).message })
      })
      .finally(() => {
        update({ importPending: false })
        importCsv.reset()
      })
  }

  const onCancel = () => {
    if (current.current.importPending) return
    revision.current += 1
    update(initialState)
  }

  return {
    opened: state.opened,
    onOpen: () => update({ opened: true }),
    onCancel,
    file: state.file,
    preview: state.confirmation?.preview ?? null,
    previewPending: state.previewPending,
    importPending: state.importPending,
    importResult: state.importResult,
    error: state.error,
    setupHref: "/legal-entities",
    onFileChange,
    onPreview,
    onImport,
  }
}
