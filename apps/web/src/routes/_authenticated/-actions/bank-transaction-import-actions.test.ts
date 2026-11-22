import { notifications } from "@mantine/notifications"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vite-plus/test"

import { trpc } from "@/utils/trpc"

import { useBankTransactionImport } from "./bank-transaction-import-actions"

const preview = {
  accountIban: "LT121000011101001000",
  total: 5,
  inserted: 3,
  skipped: 2,
  account: { id: "a", displayName: "Main", legalEntity: { id: "e", name: "Prive" } },
}
const result = { accountIban: preview.accountIban, total: 5, inserted: 3, skipped: 2 }
function renderHook<T>(client: QueryClient, hook: () => T): T {
  let captured!: T
  function Probe() {
    captured = hook()
    return null
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)))
  return captured
}
function serve() {
  const calls: { procedure: string; input: unknown }[] = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input), "http://localhost")
      const procedures = url.pathname.split("/").at(-1)!.split(",")
      const inputs = JSON.parse(init?.body ? String(init.body) : url.searchParams.get("input")!)
      return Response.json(
        procedures.map((procedure, index) => {
          expect(init?.method).toBe("POST")
          expect(url.searchParams.has("input")).toBe(false)
          calls.push({ procedure, input: inputs[index] })
          return { result: { data: procedure.endsWith("previewCsv") ? preview : result } }
        }),
      )
    }),
  )
  return calls
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("route-owned CSV confirmation", () => {
  it("requires preview plus confirmation, imports the previewed snapshot and invalidates every list variant", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const pending = trpc.bankStatementEntries.list.queryKey({ status: "PENDING", page: 1 })
    const other = trpc.bankStatementEntries.list.queryKey({ bankAccountId: "other", page: 2 })
    client.setQueryData(pending, { items: [], page: 1, pageSize: 10, totalCount: 0 })
    client.setQueryData(other, { items: [], page: 2, pageSize: 10, totalCount: 0 })
    const show = vi.spyOn(notifications, "show")
    const calls = serve()
    const actions = renderHook(client, useBankTransactionImport)
    await actions.onImport()
    expect(calls).toEqual([])
    const file = new File(["original CSV"], "statement.csv")
    actions.onOpen()
    await actions.onFileChange(file)
    expect(calls).toEqual([{ procedure: "bankStatementEntries.previewCsv", input: { csv: "original CSV" } }])
    await actions.onImport()
    expect(calls[1]).toEqual({ procedure: "bankStatementEntries.importCsv", input: { csv: "original CSV" } })
    expect(client.getQueryState(pending)?.isInvalidated).toBe(true)
    expect(client.getQueryState(other)?.isInvalidated).toBe(true)
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "green",
        message: expect.stringContaining("3 new entries (2 duplicates skipped)"),
      }),
    )
    await actions.onImport()
    expect(calls).toHaveLength(2)
    client.clear()
  })

  it("clears confirmation on file change and ignores an obsolete asynchronous preview", async () => {
    const client = new QueryClient()
    const calls = serve()
    const actions = renderHook(client, useBankTransactionImport)
    let finish!: (csv: string) => void
    const first = new File(["first"], "first.csv")
    vi.spyOn(first, "text").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const loading = actions.onFileChange(first)
    await actions.onFileChange(new File(["second"], "second.csv"))
    finish("first")
    await loading
    expect(calls.map((call) => call.procedure)).toEqual(["bankStatementEntries.previewCsv"])
    await actions.onImport()
    expect(calls[1]).toEqual({ procedure: "bankStatementEntries.importCsv", input: { csv: "second" } })
    actions.onFileChange(null)
    await actions.onImport()
    expect(calls).toHaveLength(2)
    client.clear()
  })
})

it("ignores duplicate confirmation clicks and cancellation while import is pending", async () => {
  const client = new QueryClient()
  const actions = renderHook(client, useBankTransactionImport)
  const calls = serve()
  await actions.onFileChange(new File(["csv"], "statement.csv"))
  const importing = actions.onImport()
  actions.onFileChange(new File(["replacement"], "other.csv"))
  actions.onCancel()
  await actions.onImport()
  await importing
  expect(calls).toEqual([
    { procedure: "bankStatementEntries.previewCsv", input: { csv: "csv" } },
    { procedure: "bankStatementEntries.importCsv", input: { csv: "csv" } },
  ])
  client.clear()
})

it("blocks writes after a failed preview and after cancellation", async () => {
  const client = new QueryClient()
  const actions = renderHook(client, useBankTransactionImport)
  const show = vi.spyOn(notifications, "show")
  const failed = vi.fn<() => Promise<Response>>(async () =>
    Response.json([
      {
        error: { message: "No bank account configured", code: -32600, data: { code: "BAD_REQUEST", httpStatus: 400 } },
      },
    ]),
  )
  vi.stubGlobal("fetch", failed)
  await actions.onFileChange(new File(["csv"], "statement.csv"))
  await actions.onImport()
  expect(failed).toHaveBeenCalledOnce()
  const calls = serve()
  await actions.onPreview()
  actions.onCancel()
  await actions.onImport()
  expect(calls.map((call) => call.procedure)).toEqual(["bankStatementEntries.previewCsv"])
  expect(show).not.toHaveBeenCalled()
  client.clear()
})

it("requires a fresh preview after a failed import without invalidating lists", async () => {
  const client = new QueryClient()
  const list = trpc.bankStatementEntries.list.queryKey({ page: 1 })
  client.setQueryData(list, { items: [], page: 1, pageSize: 10, totalCount: 0 })
  const actions = renderHook(client, useBankTransactionImport)
  const show = vi.spyOn(notifications, "show")
  serve()
  await actions.onFileChange(new File(["csv"], "statement.csv"))
  const failed = vi.fn<() => Promise<Response>>(async () =>
    Response.json([
      {
        error: {
          message: "Multiple bank accounts configured",
          code: -32600,
          data: { code: "BAD_REQUEST", httpStatus: 400 },
        },
      },
    ]),
  )
  vi.stubGlobal("fetch", failed)
  await actions.onImport()
  await actions.onImport()
  expect(failed).toHaveBeenCalledOnce()
  expect(client.getQueryState(list)?.isInvalidated).toBe(false)
  expect(show).toHaveBeenCalledWith({ color: "red", message: "Multiple bank accounts configured" })
  client.clear()
})

it("cancels during file reading and requires a new selection after reopening", async () => {
  const client = new QueryClient()
  const calls = serve()
  const actions = renderHook(client, useBankTransactionImport)
  actions.onOpen()
  let finish!: (csv: string) => void
  const file = new File(["csv"], "statement.csv")
  vi.spyOn(file, "text").mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const selecting = actions.onFileChange(file)
  actions.onCancel()
  finish("csv")
  await selecting
  actions.onOpen()
  await actions.onImport()
  expect(calls).toEqual([])
  await actions.onFileChange(new File(["fresh"], "fresh.csv"))
  expect(calls).toEqual([{ procedure: "bankStatementEntries.previewCsv", input: { csv: "fresh" } }])
  actions.onCancel()
  await actions.onImport()
  expect(calls).toHaveLength(1)
  client.clear()
})
