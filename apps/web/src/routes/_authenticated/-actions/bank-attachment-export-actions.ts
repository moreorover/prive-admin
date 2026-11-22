import { notifications } from "@mantine/notifications"
import { useRef, useState } from "react"

import { apiUrl } from "@/utils/server-url"

async function downloadAttachments(bankAccountId: string, month: Date) {
  if (!bankAccountId.trim() || Number.isNaN(month.getTime())) {
    throw new Error("Select a bank account and month to export")
  }
  const year = month.getFullYear()
  const monthNumber = month.getMonth() + 1
  const params = new URLSearchParams({ bankAccountId, year: String(year), month: String(monthNumber) })
  const response = await fetch(apiUrl(`/api/statement-attachments/export?${params}`), { credentials: "include" })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `Export failed (${response.status})`)
  }
  const blob = await response.blob()
  const anchor = document.createElement("a")
  const url = URL.createObjectURL(blob)
  try {
    anchor.href = url
    anchor.download = `bank-statements-${year}-${String(monthNumber).padStart(2, "0")}.zip`
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    URL.revokeObjectURL(url)
  }
}

// Invoked by route owners; components only select the account/month and emit an event.
export function useBankAttachmentExport() {
  const [pending, setPending] = useState(false)
  const inFlight = useRef(false)
  const onExport = async (bankAccountId: string, month: Date) => {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    await downloadAttachments(bankAccountId, month)
      .catch((error: unknown) => notifications.show({ color: "red", message: (error as Error).message }))
      .finally(() => {
        inFlight.current = false
        setPending(false)
      })
  }
  return { pending, onExport }
}
