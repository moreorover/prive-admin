import { notifications } from "@mantine/notifications"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vite-plus/test"

import { useBankAttachmentExport } from "./bank-attachment-export-actions"

function setup() {
  const client = new QueryClient()
  const actions: ReturnType<typeof useBankAttachmentExport>[] = []
  function Probe() {
    actions.push(useBankAttachmentExport())
    return null
  }
  renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(Probe)))
  const anchor = { href: "", download: "", click: vi.fn<() => void>(), remove: vi.fn<() => void>() }
  vi.stubGlobal("document", { createElement: () => anchor, body: { appendChild: vi.fn<() => void>() } })
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:zip")
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
  return { client, action: actions[0]!, anchor, revoke }
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("route-owned ZIP download", () => {
  it.each(["filtered-account", "explicit-picker-account"])("downloads a concrete %s and chosen month", async (id) => {
    const { action, anchor, revoke, client } = setup()
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () => new Response("zip", { headers: { "Content-Type": "application/zip" } }),
    )
    vi.stubGlobal("fetch", fetch)
    await action.onExport(id, new Date(2026, 9, 1))
    const [url, init] = fetch.mock.calls[0]!
    const params = new URL(String(url), "http://localhost").searchParams
    expect(params.get("bankAccountId")).toBe(id)
    expect(params.get("year")).toBe("2026")
    expect(params.get("month")).toBe("10")
    expect(init?.credentials).toBe("include")
    expect(anchor.download).toBe("bank-statements-2026-10.zip")
    expect(anchor.href).toBe("blob:zip")
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith("blob:zip")
    client.clear()
  })

  it("never requests an ambiguous export, even if a caller bypasses the picker", async () => {
    const { action, client } = setup()
    const fetch = vi.fn<() => void>()
    vi.stubGlobal("fetch", fetch)
    const show = vi.spyOn(notifications, "show")
    await action.onExport("", new Date(2026, 10, 1))
    await action.onExport("   ", new Date(2026, 10, 1))
    await action.onExport("a", new Date("invalid"))
    expect(fetch).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ color: "red" }))
    client.clear()
  })

  it.each(["http", "network"])("reports %s errors without downloading an error body", async (failure) => {
    const { action, anchor, client } = setup()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (failure === "network") throw new Error("Offline")
        return Response.json({ error: "Export unavailable" }, { status: 500 })
      }),
    )
    const show = vi.spyOn(notifications, "show")
    await action.onExport("a", new Date(2026, 10, 1))
    expect(anchor.click).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledWith({
      color: "red",
      message: failure === "network" ? "Offline" : "Export unavailable",
    })
    client.clear()
  })
})

it("ignores duplicate clicks while downloading and permits a retry after an HTTP failure", async () => {
  const { action, anchor, client } = setup()
  let finish!: (response: Response) => void
  const fetch = vi.fn<typeof globalThis.fetch>(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  vi.stubGlobal("fetch", fetch)
  const show = vi.spyOn(notifications, "show")
  const downloading = action.onExport("a", new Date(2026, 10, 1))
  await action.onExport("a", new Date(2026, 10, 1))
  expect(fetch).toHaveBeenCalledOnce()
  finish(new Response("Service unavailable", { status: 503 }))
  await downloading
  expect(show).toHaveBeenCalledWith({ color: "red", message: "Export failed (503)" })
  fetch.mockResolvedValueOnce(new Response("zip"))
  await action.onExport("a", new Date(2026, 10, 1))
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(anchor.click).toHaveBeenCalledOnce()
  client.clear()
})

it("does not allocate an object URL if the browser cannot create a download anchor", async () => {
  const { action, client } = setup()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("zip")),
  )
  vi.stubGlobal("document", {
    createElement: () => {
      throw new Error("Download unavailable")
    },
  })
  const show = vi.spyOn(notifications, "show")
  await action.onExport("a", new Date(2026, 10, 1))
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  expect(show).toHaveBeenCalledWith({ color: "red", message: "Download unavailable" })
  client.clear()
})
