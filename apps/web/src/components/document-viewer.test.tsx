import type { DocViewerAdapterProviderProps, DocViewerProps } from "mantine-doc-viewer"
import type { ReactElement } from "react"

import { MantineProvider } from "@mantine/core"
import { DocViewer, DocViewerAdapterProvider } from "mantine-doc-viewer"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vite-plus/test"

import { DocumentViewer } from "./document-viewer"

vi.mock("mantine-doc-viewer", async (importOriginal) => {
  const viewer = await importOriginal<typeof import("mantine-doc-viewer")>()
  return {
    ...viewer,
    DocViewer: vi.fn<(props: DocViewerProps) => ReactElement>((props) => createElement(viewer.DocViewer, props)),
    DocViewerAdapterProvider: vi.fn<(props: DocViewerAdapterProviderProps) => ReactElement>((props) =>
      createElement(viewer.DocViewerAdapterProvider, props),
    ),
  }
})

const previewUrl = "http://localhost:3000/api/statement-attachments/preview?id=attachment-1"

describe("DocumentViewer", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("passes the extensionless authenticated URL and the document metadata to Mantine", () => {
    vi.stubEnv("DEV", false)
    const document = { src: previewUrl, fileName: "statement.pdf", mimeType: "application/pdf" }
    const markup = renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))
    const src = `${previewUrl}&download=1`

    expect(vi.mocked(DocViewer).mock.lastCall?.[0]).toMatchObject({
      ...document,
      src,
      pageColorScheme: "auto",
      toolbarControls: { download: true, fullscreen: true },
    })
    expect(markup).toContain(`href="${src.replace("&", "&amp;")}" download="${document.fileName}"`)
    expect(vi.mocked(DocViewerAdapterProvider).mock.lastCall?.[0].pdf?.getOptions?.(src)).toMatchObject({
      withCredentials: true,
      disableRange: true,
    })
  })

  it.each(["text/plain", "text/csv"])("uses the authenticated same-origin proxy for %s in development", (mimeType) => {
    vi.stubEnv("DEV", true)
    const document = { src: `${previewUrl}%2F2026%20report`, fileName: "statement", mimeType }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))

    const src = vi.mocked(DocViewer).mock.lastCall?.[0].src ?? ""
    expect(src).toMatch(/^\/api\/statement-attachments\/preview\?/)
    expect(new URL(src, "http://localhost:3001").searchParams.get("id")).toBe("attachment-1/2026 report")
  })

  it("renders the unsupported preview status and preserves the download link", () => {
    const document = {
      src: "/api/statement-attachments/preview?id=attachment-1",
      fileName: "statement.docx",
      mimeType: "application/octet-stream",
    }
    const markup = renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))

    expect(markup).toContain('role="status"')
    expect(markup).toContain("Preview is not available for this file type")
    expect(markup).toContain(`href="${document.src}&amp;download=1" download="${document.fileName}"`)
  })

  it("leaves other preview sources intact", () => {
    const document = {
      src: "https://files.example.org/statement.pdf",
      fileName: "statement.pdf",
      mimeType: "application/pdf",
    }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))
    expect(vi.mocked(DocViewer).mock.lastCall?.[0].src).toBe(document.src)
  })
})
