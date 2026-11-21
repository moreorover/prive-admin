import { describe, expect, it, vi } from "vite-plus/test"

import { requireSession } from "./session"
import { statementAttachmentRoutes } from "./statement-attachments"

const getPreview = vi.hoisted(() => vi.fn<(id: string, options?: { download?: boolean }) => Promise<Response>>())

vi.mock("@prive-admin-tanstack/application/services", () => ({
  exportBankStatementAttachmentsResponse: vi.fn<() => void>(),
  getBankStatementAttachmentPreviewResponse: getPreview,
  uploadBankStatementAttachment: vi.fn<() => void>(),
}))

vi.mock("./session", () => ({ requireSession: vi.fn<typeof requireSession>() }))

describe("statement attachment preview HTTP route", () => {
  it("requires authentication for file downloads", async () => {
    vi.mocked(requireSession).mockResolvedValue(null)

    const response = await statementAttachmentRoutes.request("/preview?id=attachment-1&download=1")

    expect(response.status).toBe(401)
    expect(getPreview).not.toHaveBeenCalled()
  })

  it("forwards an authenticated download request to the attachment service", async () => {
    vi.mocked(requireSession).mockResolvedValue({} as NonNullable<Awaited<ReturnType<typeof requireSession>>>)
    getPreview.mockResolvedValue(new Response("statement bytes"))

    const response = await statementAttachmentRoutes.request("/preview?id=attachment-1&download=1")

    expect(response.status).toBe(200)
    expect(getPreview).toHaveBeenCalledWith("attachment-1", { download: true })
  })
})
