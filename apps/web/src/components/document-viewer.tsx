import { createPdfJsAdapter, DocViewer, DocViewerAdapterProvider } from "mantine-doc-viewer"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"

const pdf = createPdfJsAdapter(() => import("pdfjs-dist"), {
  workerSrc,
  options: {
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
  return (
    <DocViewerAdapterProvider pdf={pdf}>
      <DocViewer
        src={src}
        fileName={fileName}
        mimeType={mimeType}
        h="clamp(24rem, 65dvh, 48rem)"
        pageColorScheme="auto"
        toolbarControls={{ download: true, fullscreen: true }}
      />
    </DocViewerAdapterProvider>
  )
}
