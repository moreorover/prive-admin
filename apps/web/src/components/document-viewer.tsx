import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from "mantine-doc-viewer"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"

import { embeddedAttachmentPreviewUrl } from "./attachment-preview"

const pdf = createPdfJsAdapter(() => import("pdfjs-dist"), {
  workerSrc,
  options: {
    wasmUrl: `${import.meta.env.BASE_URL}pdfjs-wasm/`,
    withCredentials: true,
    disableRange: true,
  },
})

export type DocumentViewerProps = {
  src: string
  fileName: string
  mimeType: string
}

export function DocumentViewer({ src, fileName, mimeType }: DocumentViewerProps) {
  const attachmentUrl = embeddedAttachmentPreviewUrl(src)
  return (
    <DocViewerAdapterProvider pdf={pdf} textCredentials={attachmentUrl ? "include" : undefined}>
      <DocViewer
        src={attachmentUrl ?? src}
        fileName={fileName}
        mimeType={mimeType}
        h="clamp(24rem, 65dvh, 48rem)"
        pageColorScheme="auto"
        toolbarControls={{ download: true, fullscreen: true }}
      />
    </DocViewerAdapterProvider>
  )
}
