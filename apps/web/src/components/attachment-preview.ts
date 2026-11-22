import { apiUrl } from "@/utils/server-url"

export type AttachmentPreview = {
  id: string
  originalName: string
  contentType: string
}

export function attachmentPreviewUrl(attachment: Pick<AttachmentPreview, "id">) {
  return apiUrl(`/api/statement-attachments/preview?id=${encodeURIComponent(attachment.id)}`)
}
