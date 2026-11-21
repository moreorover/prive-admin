import type { DocViewerAdapterProviderProps, DocViewerProps } from "mantine-doc-viewer"
import type { ReactElement } from "react"

import { MantineProvider } from "@mantine/core"
import { DocViewer, DocViewerAdapterProvider } from "mantine-doc-viewer"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

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
  it("passes the extensionless authenticated URL and the document metadata to Mantine", () => {
    const document = { src: previewUrl, fileName: "statement.pdf", mimeType: "application/pdf" }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))

    expect(vi.mocked(DocViewer).mock.lastCall?.[0]).toMatchObject({
      ...document,
      pageColorScheme: "auto",
      toolbarControls: { download: true, fullscreen: true },
    })
    expect(vi.mocked(DocViewerAdapterProvider).mock.lastCall?.[0].pdf?.getOptions?.(previewUrl)).toMatchObject({
      withCredentials: true,
      disableRange: true,
    })
  })

  it("renders the unsupported preview status and preserves the download link", () => {
    const document = { src: previewUrl, fileName: "statement.docx", mimeType: "application/octet-stream" }
    const markup = renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))

    expect(markup).toContain('role="status"')
    expect(markup).toContain("Preview is not available for this file type")
    expect(markup).toContain(`href="${document.src}" download="${document.fileName}"`)
  })
})
