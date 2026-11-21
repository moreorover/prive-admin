import { apiUrl } from "@/utils/server-url"

const previewPath = "/api/statement-attachments/preview"
const relativeUrlBase = "https://preview.invalid"

export type AttachmentPreview = {
  id: string
  originalName: string
  contentType: string
}

export function attachmentPreviewUrl(attachment: Pick<AttachmentPreview, "id">) {
  return apiUrl(`${previewPath}?id=${encodeURIComponent(attachment.id)}`)
}

export function embeddedAttachmentPreviewUrl(src: string) {
  const url = URL.parse(src, src.startsWith("/") ? relativeUrlBase : undefined)
  if (!url || url.pathname !== previewPath || (url.protocol !== "https:" && url.protocol !== "http:")) return

  // The viewer uses the same URL for subresource loads and its download links.
  url.searchParams.set("download", "1")
  if (src.startsWith("//")) return url.href.slice(url.protocol.length)
  if (src.startsWith("/")) {
    return url.origin === relativeUrlBase ? `${url.pathname}${url.search}${url.hash}` : undefined
  }
  return url.href
}
