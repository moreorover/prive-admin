import { notifications } from "@mantine/notifications"
import { QueryClient, QueryClientProvider, type QueryObserverOptions } from "@tanstack/react-query"
import { createElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vite-plus/test"

import { trpc } from "@/utils/trpc"

import type { BankTransactionsPage } from "../-components/bank-transactions-page"

import { Route } from "../bank-transactions"

function owner() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.spyOn(Route, "useSearch").mockReturnValue({ status: "PENDING", page: 1 })
  vi.spyOn(Route, "useNavigate").mockReturnValue(vi.fn())
  vi.spyOn(Route, "useRouteContext").mockReturnValue({ queryClient: client } as ReturnType<
    typeof Route.useRouteContext
  >)
  let page!: Parameters<typeof BankTransactionsPage>[0]
  function Probe() {
    const Component = Route.options.component as () => ReactElement<typeof page>
    page = Component().props
    return null
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)))
  return { client, page }
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("unified route attachment ownership", () => {
  it("keeps both interaction-only attachment lists disabled while no entry is opened", () => {
    const { client, page } = owner()
    const lists = client.getQueryCache().findAll({ queryKey: trpc.bankStatementAttachments.list.queryKey() })
    expect(lists).toHaveLength(2)
    expect(lists.map((query) => (query.options as QueryObserverOptions).enabled)).toEqual([false, false])
    expect(page.review.openAttachmentEntryId).toBeNull()
    expect(page.review.attachments).toEqual([])
    expect(page.review.unassignedAttachments).toEqual([])
    client.clear()
  })

  it("sends assign/remove/unassign payloads from row callbacks and invalidates attachment lists/counts", async () => {
    const { client, page } = owner()
    const list = trpc.bankStatementAttachments.list.queryKey({ entryId: "entry-2", pageSize: 100 })
    const counts = trpc.bankStatementAttachments.counts.queryKey()
    const calls: { procedure: string; input: unknown }[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(String(input), "http://localhost")
        const procedures = url.pathname.split("/").at(-1)!.split(",")
        const payloads = JSON.parse(String(init?.body))
        return Response.json(
          procedures.map((procedure, index) => {
            calls.push({ procedure, input: payloads[index] })
            return { result: { data: { id: "file-1" } } }
          }),
        )
      }),
    )
    for (const [procedure, trigger, payload] of [
      ["assign", () => page.review.onAssign("file-1", "entry-2"), { id: "file-1", entryId: "entry-2" }],
      ["delete", () => page.review.onRemove("file-1"), { id: "file-1" }],
      ["unassign", () => page.review.onUnassign("file-1"), { id: "file-1" }],
    ] as const) {
      client.setQueryData(list, { items: [], totalCount: 0, page: 1, pageSize: 100 })
      client.setQueryData(counts, { "entry-2": 1 })
      trigger()
      await vi.waitFor(() => expect(client.getQueryState(counts)?.isInvalidated).toBe(true))
      expect(client.getQueryState(list)?.isInvalidated).toBe(true)
      expect(calls.at(-1)).toEqual({ procedure: `bankStatementAttachments.${procedure}`, input: payload })
    }
    client.clear()
  })

  it("uploads to the clicked entry, invalidates counts, and reports upload failures through the owner", async () => {
    const { client, page } = owner()
    const counts = trpc.bankStatementAttachments.counts.queryKey()
    client.setQueryData(counts, {})
    const file = new File(["receipt"], "receipt.txt")
    const requests: RequestInit[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        requests.push(init)
        return Response.json({ id: "file-1" })
      }),
    )
    await page.review.onUpload(file, "entry-2")
    expect(requests[0]?.credentials).toBe("include")
    expect((requests[0]!.body as FormData).get("entryId")).toBe("entry-2")
    expect(((requests[0]!.body as FormData).get("file") as File).name).toBe("receipt.txt")
    expect(client.getQueryState(counts)?.isInvalidated).toBe(true)
    const show = vi.spyOn(notifications, "show")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "Upload unavailable" }, { status: 500 })),
    )
    await page.review.onUpload(file, "entry-2")
    expect(show).toHaveBeenCalledWith({ color: "red", message: "Upload unavailable" })
    client.clear()
  })
})
