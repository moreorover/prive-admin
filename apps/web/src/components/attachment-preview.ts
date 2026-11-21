import { apiUrl } from "@/utils/server-url"

const previewPath = "/api/statement-attachments/preview"
const devApiOrigin = "http://localhost:3000"

export type AttachmentPreview = {
  id: string
  originalName: string
  contentType: string
}

export function attachmentPreviewUrl(attachment: Pick<AttachmentPreview, "id">) {
  return apiUrl(`${previewPath}?id=${encodeURIComponent(attachment.id)}`)
}

export function embeddedAttachmentPreviewUrl(src: string) {
  const url = URL.parse(src, devApiOrigin)
  if (!url || url.pathname !== previewPath) return src

  // The viewer uses the same URL for subresource loads and its download links.
  url.searchParams.set("download", "1")
  const sameOrigin = src.startsWith(`${previewPath}?`) || src === previewPath
  const useDevProxy = import.meta.env.DEV && url.origin === devApiOrigin
  return sameOrigin || useDevProxy ? `${url.pathname}${url.search}` : url.href
}
