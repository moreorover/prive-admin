import type { DocViewerAdapterProviderProps, DocViewerProps } from "mantine-doc-viewer"
import type { BaseCanvasFactory } from "pdfjs-dist/types/src/display/canvas_factory"
import type { ReactElement } from "react"

import { MantineProvider } from "@mantine/core"
import { DocViewer, DocViewerAdapterProvider } from "mantine-doc-viewer"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
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

  it("renders both halves of an image-only CCITT scan using the viewer's public decoder assets", async () => {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const props = { src: previewUrl, fileName: "scan.pdf", mimeType: "application/pdf" }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, props)))
    const options = vi.mocked(DocViewerAdapterProvider).mock.lastCall?.[0].pdf?.getOptions?.(props.src)
    const publicDir = new URL("../../public/", import.meta.url)
    const wasmUrl =
      typeof options?.wasmUrl === "string" ? fileURLToPath(new URL(`.${options.wasmUrl}`, publicDir)) : undefined
    const data = await readFile(new URL("./__fixtures__/ccitt-scan.pdf", import.meta.url))
    const task = getDocument({ data: new Uint8Array(data), wasmUrl })
    try {
      const pdf = await task.promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      const factory = pdf.canvasFactory as BaseCanvasFactory
      const { context } = factory.create(viewport.width, viewport.height)
      await page.render({ canvas: context.canvas, viewport }).promise
      expect(Array.from(context.getImageData(3, 8, 1, 1).data)).toEqual([255, 255, 255, 255])
      expect(Array.from(context.getImageData(12, 8, 1, 1).data)).toEqual([0, 0, 0, 255])
    } finally {
      await task.destroy()
    }
  })

  it.each(["text/plain", "text/csv"])("uses credentialed loading for deployed cross-origin %s", (mimeType) => {
    vi.stubEnv("DEV", false)
    const api = "https://prive-admin-server-pr-42.preview.workers.dev"
    const web = "https://prive-admin-web-pr-42.preview.workers.dev"
    const document = {
      src: `${api}/api/statement-attachments/preview?id=attachment-1%2F2026%20report`,
      fileName: "statement",
      mimeType,
    }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))

    const src = new URL(vi.mocked(DocViewer).mock.lastCall?.[0].src ?? "", web)
    expect(src.origin).toBe(api)
    expect(src.searchParams.get("id")).toBe("attachment-1/2026 report")
    expect(src.searchParams.get("download")).toBe("1")
    expect(vi.mocked(DocViewerAdapterProvider).mock.lastCall?.[0]).toMatchObject({ textCredentials: "include" })
  })

  it.each([
    [
      "/api/statement-attachments/./preview?id=attachment-1#page=2",
      "/api/statement-attachments/preview?id=attachment-1&download=1#page=2",
    ],
    [
      "//files.example.org/api/statement-attachments/preview?id=attachment-1",
      "//files.example.org/api/statement-attachments/preview?id=attachment-1&download=1",
    ],
    ["api/statement-attachments/preview?id=attachment-1", "api/statement-attachments/preview?id=attachment-1"],
  ])("preserves the URL form when adapting %s", (src, expected) => {
    const document = { src, fileName: "statement.pdf", mimeType: "application/pdf" }
    renderToStaticMarkup(createElement(MantineProvider, null, createElement(DocumentViewer, document)))
    expect(vi.mocked(DocViewer).mock.lastCall?.[0].src).toBe(expected)
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
    expect(vi.mocked(DocViewerAdapterProvider).mock.lastCall?.[0]).not.toMatchObject({ textCredentials: "include" })
  })
})
